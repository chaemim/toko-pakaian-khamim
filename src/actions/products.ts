"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { productSizes, products } from "@/db/schema";
import { requireOwner, requireUser } from "@/lib/auth";
import type { ActionState } from "@/lib/types";

const sizeSchema = z.object({
  label: z
    .string()
    .trim()
    .min(1, "Nama ukuran wajib diisi.")
    .max(20, "Nama ukuran maksimal 20 karakter."),
  costPrice: z.coerce
    .number()
    .int("Harga beli harus bilangan bulat.")
    .min(0, "Harga beli tidak boleh negatif.")
    .max(1_000_000_000),
  sellingPrice: z.coerce
    .number()
    .int("Harga jual harus bilangan bulat.")
    .min(0, "Harga jual tidak boleh negatif.")
    .max(1_000_000_000),
});

const productSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Nama produk wajib diisi.")
    .max(80, "Nama produk maksimal 80 karakter."),
  category: z.string().trim().max(40).optional().default(""),
  notes: z.string().trim().max(500).optional().default(""),
  sizes: z
    .array(sizeSchema)
    .min(1, "Minimal ada satu ukuran.")
    .max(40, "Maksimal 40 ukuran per produk."),
});

function parseProductForm(formData: FormData) {
  let sizes: unknown = [];
  try {
    sizes = JSON.parse(String(formData.get("sizes") ?? "[]"));
  } catch {
    return {
      success: false as const,
      state: {
        error: "Data ukuran tidak valid. Coba tambahkan ulang.",
        fieldErrors: { sizes: "Data ukuran tidak valid." },
      } satisfies ActionState,
    };
  }

  const result = productSchema.safeParse({
    name: formData.get("name"),
    category: formData.get("category") ?? "",
    notes: formData.get("notes") ?? "",
    sizes,
  });

  if (!result.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !fieldErrors[key]) {
        fieldErrors[key] = issue.message;
      }
    }
    return {
      success: false as const,
      state: {
        error: result.error.issues[0]?.message ?? "Periksa kembali data produk.",
        fieldErrors,
      } satisfies ActionState,
    };
  }

  const seen = new Set<string>();
  for (const size of result.data.sizes) {
    const key = size.label.toLowerCase();
    if (seen.has(key)) {
      return {
        success: false as const,
        state: {
          error: `Ukuran "${size.label}" ditulis lebih dari sekali.`,
          fieldErrors: { sizes: "Nama ukuran harus unik." },
        } satisfies ActionState,
      };
    }
    seen.add(key);
  }

  return { success: true as const, data: result.data };
}

export async function createProductAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireUser();
  const parsed = parseProductForm(formData);
  if (!parsed.success) return parsed.state;

  const { name, category, notes, sizes } = parsed.data;

  await db.transaction(async (tx) => {
    const [product] = await tx
      .insert(products)
      .values({
        name,
        category: category || null,
        notes: notes || null,
      })
      .returning({ id: products.id });

    await tx.insert(productSizes).values(
      sizes.map((size, index) => ({
        productId: product.id,
        label: size.label,
        costPrice: size.costPrice,
        sellingPrice: size.sellingPrice,
        sortOrder: index,
      })),
    );
  });

  revalidatePath("/produk");
  revalidatePath("/penjualan/baru");
  redirect("/produk?status=dibuat");
}

export async function updateProductAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Produk tidak ditemukan." };

  const parsed = parseProductForm(formData);
  if (!parsed.success) return parsed.state;

  const { name, category, notes, sizes } = parsed.data;
  const [existing] = await db
    .select({ id: products.id })
    .from(products)
    .where(eq(products.id, id))
    .limit(1);

  if (!existing) return { error: "Produk sudah tidak ada. Mungkin telah dihapus." };

  await db.transaction(async (tx) => {
    await tx
      .update(products)
      .set({
        name,
        category: category || null,
        notes: notes || null,
        updatedAt: new Date(),
      })
      .where(eq(products.id, id));

    await tx.delete(productSizes).where(eq(productSizes.productId, id));
    await tx.insert(productSizes).values(
      sizes.map((size, index) => ({
        productId: id,
        label: size.label,
        costPrice: size.costPrice,
        sellingPrice: size.sellingPrice,
        sortOrder: index,
      })),
    );
  });

  revalidatePath("/produk");
  revalidatePath(`/produk/${id}`);
  revalidatePath("/penjualan/baru");
  redirect("/produk?status=diperbarui");
}

export async function toggleProductAction(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  const nextValue = String(formData.get("isActive") ?? "") === "true";
  if (!id) return;

  await db
    .update(products)
    .set({ isActive: nextValue, updatedAt: new Date() })
    .where(eq(products.id, id));

  revalidatePath("/produk");
  revalidatePath("/penjualan/baru");
}

export async function deleteProductAction(formData: FormData) {
  await requireOwner();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await db.delete(products).where(eq(products.id, id));
  revalidatePath("/produk");
  revalidatePath("/penjualan/baru");
  redirect("/produk?status=dihapus");
}


