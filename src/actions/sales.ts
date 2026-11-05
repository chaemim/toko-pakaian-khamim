"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { productSizes, products, saleItems, sales } from "@/db/schema";
import { requireOwner, requireUser } from "@/lib/auth";
import { isValidDateString } from "@/lib/date";
import type { ActionState } from "@/lib/types";

const itemSchema = z.object({
  sizeId: z.string().uuid("Ukuran tidak valid."),
  qty: z.coerce.number().int().min(1).max(999),
  unitPrice: z.coerce.number().int().min(0).max(1_000_000_000),
});

const saleSchema = z.object({
  soldOn: z.string().refine(isValidDateString, "Tanggal tidak valid."),
  customerName: z.string().trim().max(80).optional().default(""),
  paymentMethod: z.enum(["cash", "transfer", "qris", "other"]),
  discount: z.coerce.number().int().min(0).max(1_000_000_000),
  note: z.string().trim().max(300).optional().default(""),
  items: z.array(itemSchema).min(1, "Tambahkan minimal satu barang.").max(100),
});

function invoicePrefix(soldOn: string) {
  return `INV-${soldOn.replaceAll("-", "")}`;
}

async function nextInvoiceNo(soldOn: string) {
  const prefix = invoicePrefix(soldOn);
  const [last] = await db
    .select({ invoiceNo: sales.invoiceNo })
    .from(sales)
    .where(eq(sales.soldOn, soldOn))
    .orderBy(desc(sales.createdAt))
    .limit(1);

  let sequence = 1;
  if (last?.invoiceNo.startsWith(`${prefix}-`)) {
    const parsed = Number(last.invoiceNo.slice(prefix.length + 1));
    if (Number.isFinite(parsed)) sequence = parsed + 1;
  }

  return `${prefix}-${String(sequence).padStart(3, "0")}`;
}

export async function createSaleAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();

  let rawItems: unknown;
  try {
    rawItems = JSON.parse(String(formData.get("items") ?? "[]"));
  } catch {
    return { error: "Daftar barang tidak valid. Muat ulang halaman lalu coba lagi." };
  }

  const result = saleSchema.safeParse({
    soldOn: formData.get("soldOn"),
    customerName: formData.get("customerName") ?? "",
    paymentMethod: formData.get("paymentMethod") ?? "cash",
    discount: formData.get("discount") ?? 0,
    note: formData.get("note") ?? "",
    items: rawItems,
  });

  if (!result.success) {
    const message = result.error.issues[0];
    return {
      error: message?.message ?? "Periksa kembali data penjualan.",
      fieldErrors: message?.path[0] === "items" ? { items: message.message } : {},
    };
  }

  const input = result.data;

  // Gabungkan baris dengan ukuran yang sama.
  const merged = new Map<
    string,
    { sizeId: string; qty: number; unitPrice: number }
  >();
  for (const item of input.items) {
    const current = merged.get(item.sizeId);
    if (current) {
      current.qty += item.qty;
    } else {
      merged.set(item.sizeId, { ...item });
    }
  }

  const sizeIds = [...merged.keys()];
  const rows = await db
    .select({
      sizeId: productSizes.id,
      sizeLabel: productSizes.label,
      costPrice: productSizes.costPrice,
      sellingPrice: productSizes.sellingPrice,
      productId: products.id,
      productName: products.name,
    })
    .from(productSizes)
    .innerJoin(products, eq(productSizes.productId, products.id))
    .where(inArray(productSizes.id, sizeIds));

  if (rows.length !== sizeIds.length) {
    return {
      error:
        "Sebagian produk atau ukuran sudah tidak tersedia. Muat ulang halaman lalu pilih ulang barangnya.",
      fieldErrors: { items: "Produk/ukuran tidak ditemukan." },
    };
  }

  const sizeMap = new Map(rows.map((row) => [row.sizeId, row]));

  const preparedItems = [...merged.values()].map((item) => {
    const size = sizeMap.get(item.sizeId)!;
    const subtotal = item.qty * item.unitPrice;
    return {
      productId: size.productId,
      productName: size.productName,
      sizeLabel: size.sizeLabel,
      qty: item.qty,
      costPrice: size.costPrice,
      listPrice: size.sellingPrice,
      unitPrice: item.unitPrice,
      subtotal,
      profit: (item.unitPrice - size.costPrice) * item.qty,
    };
  });

  const subtotal = preparedItems.reduce((sum, item) => sum + item.subtotal, 0);
  const grossProfit = preparedItems.reduce((sum, item) => sum + item.profit, 0);
  const totalCost = preparedItems.reduce(
    (sum, item) => sum + item.costPrice * item.qty,
    0,
  );

  if (input.discount > subtotal) {
    return {
      error: "Diskon tidak boleh melebihi subtotal.",
      fieldErrors: { discount: "Diskon melebihi subtotal." },
    };
  }

  const total = subtotal - input.discount;
  const profit = grossProfit - input.discount;

  let saleId = "";
  let lastError: unknown = null;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      const invoiceNo = await nextInvoiceNo(input.soldOn);
      saleId = await db.transaction(async (tx) => {
        const [sale] = await tx
          .insert(sales)
          .values({
            invoiceNo,
            soldOn: input.soldOn,
            customerName: input.customerName || null,
            paymentMethod: input.paymentMethod,
            note: input.note || null,
            subtotal,
            discount: input.discount,
            total,
            totalCost,
            profit,
            createdBy: user.id,
          })
          .returning({ id: sales.id });

        await tx.insert(saleItems).values(
          preparedItems.map((item) => ({
            saleId: sale.id,
            ...item,
          })),
        );

        return sale.id;
      });
      break;
    } catch (error) {
      lastError = error;
      if ((error as { code?: string }).code !== "23505") break;
    }
  }

  if (!saleId) {
    console.error("Gagal menyimpan penjualan", lastError);
    return {
      error: "Penjualan gagal disimpan. Silakan coba lagi sebentar lagi.",
    };
  }

  revalidatePath("/dashboard");
  revalidatePath("/penjualan");
  revalidatePath("/laporan");

  redirect(`/penjualan/${saleId}?baru=1`);
}

export async function deleteSaleAction(formData: FormData) {
  await requireOwner();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await db.delete(sales).where(eq(sales.id, id));
  revalidatePath("/dashboard");
  revalidatePath("/penjualan");
  revalidatePath("/laporan");
  redirect("/penjualan?status=dihapus");
}
