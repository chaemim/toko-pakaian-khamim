import Link from "next/link";
import { Plus, Tags } from "lucide-react";

import { requireUser } from "@/lib/auth";
import { getProductsWithSizes } from "@/lib/queries";
import { PageHeader } from "@/components/ui/page-header";
import { buttonClasses } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { ProductsBrowser } from "@/components/products/products-browser";

export const metadata = { title: "Produk" };

const statusMessages: Record<string, string> = {
  dibuat: "Produk baru berhasil ditambahkan.",
  diperbarui: "Perubahan produk berhasil disimpan.",
  dihapus: "Produk berhasil dihapus.",
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireUser();
  const params = await searchParams;
  const products = await getProductsWithSizes();

  const categories = [
    ...new Set(
      products
        .map((product) => product.category)
        .filter((category): category is string => Boolean(category)),
    ),
  ].sort((a, b) => a.localeCompare(b));

  const message = params.status ? statusMessages[params.status] : undefined;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Katalog"
        title="Produk & harga"
        description="Atur harga beli dan harga jual untuk setiap ukuran. Produk nonaktif tetap menyimpan riwayat penjualan."
        actions={
          <>
            <Link
              href="/produk/daftar-harga"
              className={buttonClasses({ variant: "secondary" })}
            >
              <Tags className="h-4 w-4" />
              Daftar harga
            </Link>
            <Link
              href="/produk/baru"
              className={buttonClasses({ variant: "primary" })}
            >
              <Plus className="h-4 w-4" />
              Tambah produk
            </Link>
          </>
        }
      />

      {message ? <Alert tone="success">{message}</Alert> : null}

      <ProductsBrowser
        categories={categories}
        products={products.map((product) => ({
          id: product.id,
          name: product.name,
          category: product.category,
          isActive: product.isActive,
          sizes: product.sizes.map((size) => ({
            id: size.id,
            label: size.label,
            costPrice: size.costPrice,
          })),
        }))}
      />
    </div>
  );
}
