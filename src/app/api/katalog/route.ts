import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { getProductsWithSizes } from "@/lib/queries";

export const dynamic = "force-dynamic";

/** Katalog produk aktif untuk disimpan di perangkat (dipakai mode offline). */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const products = await getProductsWithSizes();
  const catalog = products
    .filter((product) => product.isActive && product.sizes.length > 0)
    .map((product) => ({
      id: product.id,
      name: product.name,
      category: product.category,
      sizes: product.sizes.map((size) => ({
        id: size.id,
        label: size.label,
        costPrice: size.costPrice,
        sellingPrice: size.sellingPrice,
      })),
    }));

  return NextResponse.json(
    { products: catalog, updatedAt: Date.now() },
    { headers: { "Cache-Control": "no-store" } },
  );
}
