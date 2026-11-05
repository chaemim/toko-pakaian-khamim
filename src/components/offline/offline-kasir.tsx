"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CloudOff } from "lucide-react";

import { OfflineManager } from "@/components/offline/offline-manager";
import { PendingList } from "@/components/offline/pending-list";
import { useOnline } from "@/components/offline/use-online";
import { SaleForm, type SaleProduct } from "@/components/sales/sale-form";
import { buttonClasses } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { jakartaToday } from "@/lib/date";
import { loadCatalog } from "@/lib/offline/sync";

/**
 * Halaman cadangan saat app dibuka tanpa koneksi. Seluruh datanya berasal dari
 * penyimpanan perangkat (IndexedDB), jadi tidak butuh server maupun login.
 */
export function OfflineKasir() {
  const online = useOnline();
  const [products, setProducts] = useState<SaleProduct[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadCatalog()
      .then((rows) => {
        if (!cancelled) setProducts(rows);
      })
      .catch(() => {
        if (!cancelled) setProducts([]);
      });
    return () => {
      cancelled = true;
    };
  }, [online]);

  return (
    <div className="mx-auto min-h-screen w-full max-w-[1200px] space-y-5 px-4 py-6 sm:px-6 lg:px-10">
      <OfflineManager showListLink={false} />

      <PageHeader
        eyebrow={online ? "Antrean & kasir" : "Mode offline"}
        title="Catat penjualan"
        description={
          online
            ? "Anda sedang online. Transaksi di bawah akan dikirim otomatis."
            : "Tidak ada sinyal. Penjualan disimpan di perangkat dan dikirim saat koneksi kembali."
        }
        actions={
          <Link
            href="/dashboard"
            className={buttonClasses({ variant: "secondary" })}
          >
            {online ? "Ke beranda" : "Coba buka beranda"}
          </Link>
        }
      />

      <PendingList />

      {products === null ? (
        <p className="text-sm text-muted">Memuat katalog dari perangkat…</p>
      ) : products.length === 0 ? (
        <EmptyState
          icon={<CloudOff className="h-6 w-6" />}
          title="Katalog belum tersimpan di perangkat"
          description="Buka aplikasi sekali saat ada sinyal supaya daftar produk dan harga tersimpan untuk dipakai offline."
        />
      ) : (
        <SaleForm products={products} today={jakartaToday()} />
      )}
    </div>
  );
}
