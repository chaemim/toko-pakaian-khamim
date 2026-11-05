import Link from "next/link";
import { ArrowLeft, Tag } from "lucide-react";

import { requireUser } from "@/lib/auth";
import { getProductsWithSizes, getStoreSettings } from "@/lib/queries";
import { formatDate } from "@/lib/date";
import { formatRupiah } from "@/lib/format";
import { PageHeader } from "@/components/ui/page-header";
import { buttonClasses } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PrintButton } from "@/components/print-button";
import type { ProductWithSizes } from "@/lib/queries";

export const metadata = { title: "Daftar harga" };

function groupByCategory(products: ProductWithSizes[]) {
  const groups = new Map<string, ProductWithSizes[]>();
  for (const product of products) {
    const key = product.category?.trim() || "Lainnya";
    const list = groups.get(key) ?? [];
    list.push(product);
    groups.set(key, list);
  }
  return [...groups.entries()]
    .map(([category, items]) => ({
      category,
      items: items.sort((a, b) => a.name.localeCompare(b.name)),
    }))
    .sort((a, b) => {
      if (a.category === "Lainnya") return 1;
      if (b.category === "Lainnya") return -1;
      return a.category.localeCompare(b.category);
    });
}

export default async function PriceListPage() {
  await requireUser();
  const [products, store] = await Promise.all([
    getProductsWithSizes(),
    getStoreSettings(),
  ]);

  const active = products.filter(
    (product) => product.isActive && product.sizes.length > 0,
  );
  const groups = groupByCategory(active);
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  return (
    <div className="space-y-6">
      <div className="no-print">
        <PageHeader
          eyebrow="Katalog"
          title="Daftar harga"
          description="Harga jual semua produk per ukuran. Halaman ini siap dicetak untuk ditempel di toko."
          actions={
            <>
              <Link
                href="/produk"
                className={buttonClasses({ variant: "secondary" })}
              >
                <ArrowLeft className="h-4 w-4" />
                Kembali
              </Link>
              <PrintButton label="Cetak" />
            </>
          }
        />
      </div>

      {active.length === 0 ? (
        <EmptyState
          icon={<Tag className="h-6 w-6" />}
          title="Belum ada produk aktif"
          description="Tambahkan produk terlebih dahulu agar daftar harga bisa dicetak."
          action={
            <Link
              href="/produk/baru"
              className={buttonClasses({ size: "md" })}
            >
              Tambah produk
            </Link>
          }
        />
      ) : (
        <Card className="print-card overflow-hidden">
          <div className="border-b border-line px-5 py-6 text-center sm:px-8 sm:py-8">
            <p className="font-display text-2xl font-semibold text-ink sm:text-3xl">
              {store.storeName}
            </p>
            {store.tagline ? (
              <p className="mt-1 text-xs text-muted">{store.tagline}</p>
            ) : null}
            <p className="mt-1 text-[11px] text-muted">
              {[store.address, store.phone].filter(Boolean).join(" · ") ||
                "Daftar harga resmi toko"}
            </p>
            <div className="mt-5 inline-flex flex-col items-center gap-1 border-y border-line px-8 py-2">
              <p className="font-display text-lg font-semibold uppercase tracking-[0.18em] text-brand-800">
                Daftar Harga
              </p>
              <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted">
                Per {formatDate(today, { day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>
          </div>

          <div className="space-y-7 px-5 py-6 sm:px-8 sm:py-8">
            {groups.map((group) => (
              <section key={group.category}>
                <h2 className="mb-2 flex items-center gap-2 font-display text-base font-semibold text-brand-800">
                  <span className="h-1.5 w-1.5 rounded-full bg-gold-500" />
                  {group.category}
                  <span className="text-[10px] font-medium text-muted">
                    ({group.items.length} produk)
                  </span>
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[440px] border-collapse text-sm">
                    <thead>
                      <tr className="border-y border-line bg-cream/50 text-left text-[10px] font-bold uppercase tracking-[0.08em] text-muted">
                        <th className="px-3 py-2 font-bold">Produk</th>
                        <th className="px-3 py-2 font-bold">Ukuran</th>
                        <th className="px-3 py-2 text-right font-bold">Harga</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.items.map((product) =>
                        product.sizes.map((size, index) => (
                          <tr
                            key={size.id}
                            className="border-b border-line/60 last:border-0"
                          >
                            {index === 0 ? (
                              <td
                                rowSpan={product.sizes.length}
                                className="px-3 py-2.5 align-top font-semibold text-ink"
                              >
                                {product.name}
                              </td>
                            ) : null}
                            <td className="px-3 py-2.5 text-xs text-muted">
                              {size.label}
                            </td>
                            <td className="px-3 py-2.5 text-right text-xs font-semibold tabular-nums text-ink">
                              {formatRupiah(size.sellingPrice)}
                            </td>
                          </tr>
                        )),
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            ))}
          </div>

          <div className="border-t border-line bg-cream/40 px-5 py-4 text-center text-[10px] leading-relaxed text-muted sm:px-8">
            {store.receiptNote ||
              "Harga dapat berubah sewaktu-waktu. Terima kasih sudah berbelanja."}
          </div>
        </Card>
      )}
    </div>
  );
}
