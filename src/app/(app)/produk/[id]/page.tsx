import Link from "next/link";
import { notFound } from "next/navigation";
import { Archive, ArchiveRestore, ArrowLeft, Trash2 } from "lucide-react";

import { requireUser } from "@/lib/auth";
import { getProductWithSizes, getProductsWithSizes } from "@/lib/queries";
import { PageHeader } from "@/components/ui/page-header";
import { buttonClasses } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";
import { ConfirmForm } from "@/components/confirm-form";
import { ProductForm } from "@/components/products/product-form";
import { deleteProductAction, toggleProductAction } from "@/actions/products";

export const metadata = { title: "Kelola produk" };

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const [product, allProducts] = await Promise.all([
    getProductWithSizes(id),
    getProductsWithSizes(),
  ]);

  if (!product) notFound();

  const categories = [
    ...new Set(
      allProducts
        .map((item) => item.category)
        .filter((category): category is string => Boolean(category)),
    ),
  ].sort((a, b) => a.localeCompare(b));

  const isOwner = user.role === "owner";

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Katalog"
        title={product.name}
        description="Perbarui informasi produk, ukuran, dan harga. Perubahan tidak memengaruhi transaksi yang sudah tercatat."
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

      <ProductForm
        mode="edit"
        categories={categories}
        product={{
          id: product.id,
          name: product.name,
          category: product.category,
          notes: product.notes,
          sizes: product.sizes.map((size) => ({
            id: size.id,
            label: size.label,
            costPrice: size.costPrice,
            sellingPrice: size.sellingPrice,
          })),
        }}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader
            title="Status produk"
            description={
              product.isActive
                ? "Produk aktif dan bisa dipilih saat mencatat penjualan."
                : "Produk nonaktif tidak muncul saat mencatat penjualan."
            }
            action={
              <Badge tone={product.isActive ? "brand" : "muted"}>
                {product.isActive ? "Aktif" : "Nonaktif"}
              </Badge>
            }
          />
          <div className="p-4">
            <ConfirmForm
              action={toggleProductAction}
              confirmMessage={
                product.isActive
                  ? `Nonaktifkan "${product.name}"? Produk tidak akan muncul saat mencatat penjualan.`
                  : `Aktifkan kembali "${product.name}"?`
              }
            >
              <input type="hidden" name="id" value={product.id} />
              <input
                type="hidden"
                name="isActive"
                value={product.isActive ? "false" : "true"}
              />
              <button
                type="submit"
                className={buttonClasses({
                  variant: "secondary",
                  className: "w-full",
                })}
              >
                {product.isActive ? (
                  <>
                    <Archive className="h-4 w-4" />
                    Nonaktifkan produk
                  </>
                ) : (
                  <>
                    <ArchiveRestore className="h-4 w-4" />
                    Aktifkan produk
                  </>
                )}
              </button>
            </ConfirmForm>
          </div>
        </Card>

        {isOwner ? (
          <Card className="border-rust-100">
            <CardHeader
              title="Hapus produk"
              description="Hanya lakukan jika produk memang tidak dipakai lagi."
            />
            <div className="p-4">
              <ConfirmForm
                action={deleteProductAction}
                confirmMessage={`Hapus permanen "${product.name}"? Semua ukuran dan harganya akan hilang. Riwayat penjualan lama tetap tersimpan.`}
              >
                <input type="hidden" name="id" value={product.id} />
                <button
                  type="submit"
                  className={buttonClasses({
                    variant: "secondary",
                    className:
                      "w-full border-rust-100 text-rust-600 hover:border-rust-200 hover:bg-rust-50",
                  })}
                >
                  <Trash2 className="h-4 w-4" />
                  Hapus produk permanen
                </button>
              </ConfirmForm>
            </div>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
