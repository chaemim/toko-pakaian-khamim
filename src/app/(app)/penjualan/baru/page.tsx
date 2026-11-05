import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";

import { requireUser } from "@/lib/auth";
import { getProductsWithSizes } from "@/lib/queries";
import { jakartaToday } from "@/lib/date";
import { PageHeader } from "@/components/ui/page-header";
import { buttonClasses } from "@/components/ui/button";
import { SaleForm } from "@/components/sales/sale-form";

export const metadata = { title: "Catat penjualan" };

export default async function NewSalePage() {
  await requireUser();
  const products = await getProductsWithSizes();
  const today = jakartaToday();

  const available = products
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

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Transaksi baru"
        title="Catat penjualan"
        description="Pilih ukuran, atur jumlah dan harga deal, lalu simpan. Laba dihitung otomatis."
        actions={
          <>
            <Link
              href="/penjualan/transaksi"
              className={buttonClasses({ variant: "secondary" })}
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Riwayat transaksi</span>
              <span className="sm:hidden">Kembali</span>
            </Link>
            <span className="hidden sm:inline-flex">
              <Link
                href="/produk/baru"
                className={buttonClasses({ variant: "ghost" })}
              >
                <Plus className="h-4 w-4" />
                Produk baru
              </Link>
            </span>
          </>
        }
      />

      <SaleForm products={available} today={today} />
    </div>
  );
}
