"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { sales } from "@/db/schema";
import { requireOwner, requireUser } from "@/lib/auth";
import { createSale, saleInputSchema } from "@/lib/sales-service";
import type { ActionState } from "@/lib/types";

/**
 * Jalur online langsung (tanpa antrean). Form catat penjualan sekarang memakai
 * antrean lokal + /api/sales/sync, tetapi action ini dipertahankan agar tetap
 * bisa dipakai bila dibutuhkan.
 */
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

  const result = saleInputSchema.safeParse({
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

  const created = await createSale(result.data, user.id);
  if (!created.ok) {
    return { error: created.error, fieldErrors: created.fieldErrors };
  }

  revalidatePath("/dashboard");
  revalidatePath("/penjualan");
  revalidatePath("/laporan");

  redirect(`/penjualan/${created.saleId}?baru=1`);
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
