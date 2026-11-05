import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { requireUser } from "@/lib/auth";
import { getProductsWithSizes } from "@/lib/queries";
import { PageHeader } from "@/components/ui/page-header";
import { buttonClasses } from "@/components/ui/button";
import { ProductForm } from "@/components/products/product-form";

export const metadata = { title: "Tambah produk" };

export default async function NewProductPage() {
  await requireUser();
  const products = await getProductsWithSizes();
  const categories = [
    ...new Set(
      products
        .map((product) => product.category)
        .filter((category): category is string => Boolean(category)),
    ),
  ].sort((a, b) => a.localeCompare(b));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Katalog"
        title="Tambah produk"
        description="Isi informasi pakaian dan harga untuk setiap ukuran. Anda bisa menambahkan ukuran sebanyak yang dibutuhkan."
        actions={
          <Link
            href="/produk"
            className={buttonClasses({ variant: "secondary" })}
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </Link>
        }
      />

      <ProductForm mode="create" categories={categories} />
    </div>
  );
}
