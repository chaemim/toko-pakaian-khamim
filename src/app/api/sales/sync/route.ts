import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth";
import { createSale, saleInputSchema } from "@/lib/sales-service";

export const dynamic = "force-dynamic";

const MAX_BATCH = 50;

const envelopeSchema = z.object({
  sales: z.array(z.unknown()).min(1).max(MAX_BATCH),
});

const metaSchema = z.object({
  clientId: z.string().uuid(),
  // Waktu transaksi dicatat di perangkat (ms sejak epoch).
  createdAt: z.number().int().positive().optional(),
});

type ItemResult =
  | {
      clientId: string | null;
      ok: true;
      saleId: string;
      invoiceNo: string;
      duplicate: boolean;
    }
  | { clientId: string | null; ok: false; error: string; retryable: boolean };

function safeCreatedAt(value: number | undefined): Date | undefined {
  if (!value) return undefined;
  const now = Date.now();
  // Jangan percaya waktu di masa depan; batasi maksimal 90 hari ke belakang.
  if (value > now) return new Date(now);
  if (value < now - 90 * 86_400_000) return undefined;
  return new Date(value);
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body tidak valid." }, { status: 400 });
  }

  const envelope = envelopeSchema.safeParse(body);
  if (!envelope.success) {
    return NextResponse.json({ error: "Format data tidak valid." }, { status: 400 });
  }

  // Urutkan menurut waktu catat agar nomor invoice mengikuti urutan transaksi.
  const entries = envelope.data.sales
    .map((raw) => ({ raw, meta: metaSchema.safeParse(raw) }))
    .sort((a, b) => {
      const ta = a.meta.success ? (a.meta.data.createdAt ?? 0) : 0;
      const tb = b.meta.success ? (b.meta.data.createdAt ?? 0) : 0;
      return ta - tb;
    });

  const results: ItemResult[] = [];

  for (const { raw, meta } of entries) {
    if (!meta.success) {
      results.push({
        clientId: null,
        ok: false,
        retryable: false,
        error: "ID transaksi tidak valid.",
      });
      continue;
    }

    const { clientId, createdAt } = meta.data;
    const parsed = saleInputSchema.safeParse(raw);
    if (!parsed.success) {
      results.push({
        clientId,
        ok: false,
        retryable: false,
        error: parsed.error.issues[0]?.message ?? "Data penjualan tidak valid.",
      });
      continue;
    }

    try {
      const created = await createSale(parsed.data, user.id, {
        clientId,
        createdAt: safeCreatedAt(createdAt),
      });
      results.push(
        created.ok
          ? {
              clientId,
              ok: true,
              saleId: created.saleId,
              invoiceNo: created.invoiceNo,
              duplicate: created.duplicate,
            }
          : {
              clientId,
              ok: false,
              error: created.error,
              retryable: created.retryable,
            },
      );
    } catch (error) {
      console.error("Sinkronisasi penjualan gagal", error);
      results.push({
        clientId,
        ok: false,
        retryable: true,
        error: "Server sedang bermasalah. Akan dicoba lagi.",
      });
    }
  }

  if (results.some((result) => result.ok && !result.duplicate)) {
    revalidatePath("/dashboard");
    revalidatePath("/penjualan");
    revalidatePath("/laporan");
  }

  return NextResponse.json({ results });
}
