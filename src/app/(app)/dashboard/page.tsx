import Link from "next/link";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  PackagePlus,
  Plus,
  ReceiptText,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  Wallet,
} from "lucide-react";
import clsx from "clsx";

import { requireUser } from "@/lib/auth";
import {
  getDashboardData,
  getStoreSettings,
} from "@/lib/queries";
import { formatDateLong, formatDate } from "@/lib/date";
import { formatPercent, formatRupiah } from "@/lib/format";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { StatCard } from "@/components/dashboard/stat-card";
import { DailyChart } from "@/components/charts/daily-chart";

export const metadata = { title: "Beranda" };

function Trend({
  current,
  previous,
}: {
  current: number;
  previous: number;
}) {
  if (current === 0 && previous === 0) {
    return <span className="text-[11px] text-muted">Belum ada data</span>;
  }

  if (previous === 0) {
    return (
      <>
        <Badge tone="brand">
          <ArrowUpRight className="h-3 w-3" />
          Baru
        </Badge>
        <span className="text-[11px] text-muted">vs kemarin</span>
      </>
    );
  }

  const change = ((current - previous) / previous) * 100;
  const positive = change >= 0;

  return (
    <>
      <span
        className={clsx(
          "inline-flex items-center gap-0.5 text-[11px] font-bold",
          positive ? "text-brand-600" : "text-rust-500",
        )}
      >
        {positive ? (
          <ArrowUpRight className="h-3.5 w-3.5" />
        ) : (
          <ArrowDownRight className="h-3.5 w-3.5" />
        )}
        {formatPercent(Math.abs(change), 1)}
      </span>
      <span className="text-[11px] text-muted">vs kemarin</span>
    </>
  );
}

export default async function DashboardPage() {
  const user = await requireUser();
  const store = await getStoreSettings();
  const data = await getDashboardData();

  const displayName = user.name.trim() || "kak";
  const hour = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Jakarta",
      hour: "numeric",
      hour12: false,
    }).format(new Date()),
  );
  const greeting =
    hour < 11
      ? "Selamat pagi"
      : hour < 15
        ? "Selamat siang"
        : hour < 18
          ? "Selamat sore"
          : "Selamat malam";

  const maxProductRevenue = Math.max(
    ...data.topProducts.map((product) => product.revenue),
    1,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={formatDateLong(data.today)}
        title={`${greeting}, ${displayName}`}
        description={`Ini ringkasan ${store.storeName} hari ini. Semoga dagangan makin ramai.`}
        actions={
          <>
            <Link
              href="/laporan"
              className={buttonClasses({ variant: "secondary" })}
            >
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Lihat laporan</span>
              <span className="sm:hidden">Laporan</span>
            </Link>
            <Link
              href="/penjualan/baru"
              className={buttonClasses({ variant: "primary" })}
            >
              <Plus className="h-4 w-4" />
              Catat jualan
            </Link>
          </>
        }
      />

      {data.productCount === 0 ? (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-800 via-brand-800 to-brand-700 p-6 text-cream shadow-lift sm:p-8">
          <div className="dotted-grid absolute inset-0 opacity-30" />
          <div className="absolute -right-16 -top-20 h-60 w-60 rounded-full bg-gold-500/10 blur-3xl" />
          <div className="relative max-w-2xl">
            <Badge tone="gold" className="bg-gold-100">
              <Sparkles className="h-3 w-3" />
              Mulai di sini
            </Badge>
            <h2 className="mt-3 font-display text-2xl font-semibold leading-tight sm:text-3xl">
              Siapkan produk pertama Anda
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-brand-100/85">
              Tambahkan nama pakaian, harga beli, dan harga jual per ukuran.
              Setelah itu Anda bisa langsung mencatat penjualan.
            </p>
            <ol className="mt-5 grid gap-2 sm:grid-cols-3">
              {[
                "Tambah produk & ukuran",
                "Isi harga beli dan jual",
                "Mulai catat penjualan",
              ].map((step, index) => (
                <li
                  key={step}
                  className="flex items-center gap-2 rounded-xl bg-paper/10 px-3 py-2.5 text-xs font-medium ring-1 ring-paper/10"
                >
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-gold-300 text-[10px] font-bold text-brand-900">
                    {index + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
            <Link
              href="/produk/baru"
              className={buttonClasses({
                variant: "secondary",
                className:
                  "mt-5 border-transparent bg-paper text-brand-800 hover:bg-gold-50",
              })}
            >
              <PackagePlus className="h-4 w-4" />
              Tambah produk pertama
            </Link>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard
          title="Omzet hari ini"
          value={formatRupiah(data.todaySummary.revenue)}
          icon={<Wallet className="h-[18px] w-[18px]" />}
          footer={
            <Trend
              current={data.todaySummary.revenue}
              previous={data.yesterdaySummary.revenue}
            />
          }
        />
        <StatCard
          title="Laba hari ini"
          value={formatRupiah(data.todaySummary.profit)}
          icon={<TrendingUp className="h-[18px] w-[18px]" />}
          tone="gold"
          footer={
            <Trend
              current={data.todaySummary.profit}
              previous={data.yesterdaySummary.profit}
            />
          }
        />
        <StatCard
          title="Transaksi"
          value={`${data.todaySummary.transactions}×`}
          icon={<ReceiptText className="h-[18px] w-[18px]" />}
          tone="ink"
          footer={
            <Trend
              current={data.todaySummary.transactions}
              previous={data.yesterdaySummary.transactions}
            />
          }
        />
        <StatCard
          title="Barang terjual"
          value={`${data.todaySummary.items} pcs`}
          icon={<ShoppingBag className="h-[18px] w-[18px]" />}
          tone="brand"
          footer={
            <Trend
              current={data.todaySummary.items}
              previous={data.yesterdaySummary.items}
            />
          }
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.55fr_1fr]">
        <Card>
          <CardHeader
            title="7 hari terakhir"
            description="Omzet dan laba harian"
            action={
              <div className="text-right">
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted">
                  Total minggu ini
                </p>
                <p className="mt-0.5 text-sm font-bold tabular-nums text-ink">
                  {formatRupiah(data.weekSummary.revenue)}
                </p>
              </div>
            }
          />
          <div className="p-4 sm:p-5">
            <DailyChart data={data.daily} />
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Produk terlaris"
            description="Bulan ini berdasarkan omzet"
            action={
              <Link
                href="/laporan"
                className="text-[11px] font-semibold text-brand-700 hover:text-brand-800"
              >
                Lihat semua
              </Link>
            }
          />
          <div className="p-4 sm:p-5">
            {data.topProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <span className="mb-3 grid h-11 w-11 place-items-center rounded-xl bg-cream text-muted">
                  <ShoppingBag className="h-5 w-5" />
                </span>
                <p className="text-sm font-semibold text-ink">
                  Belum ada penjualan
                </p>
                <p className="mt-1 max-w-[220px] text-xs leading-relaxed text-muted">
                  Produk terlaris akan muncul setelah ada transaksi.
                </p>
              </div>
            ) : (
              <ol className="space-y-4">
                {data.topProducts.map((product, index) => (
                  <li key={`${product.productId}-${product.productName}`}>
                    <div className="flex items-center gap-3">
                      <span
                        className={clsx(
                          "grid h-7 w-7 shrink-0 place-items-center rounded-lg text-[11px] font-bold",
                          index === 0
                            ? "bg-gold-100 text-gold-700"
                            : "bg-cream text-muted",
                        )}
                      >
                        {index + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <p className="truncate text-xs font-semibold text-ink">
                            {product.productName}
                          </p>
                          <p className="shrink-0 text-[11px] font-bold tabular-nums text-ink">
                            {formatRupiah(product.revenue)}
                          </p>
                        </div>
                        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-cream">
                          <div
                            className="h-full rounded-full bg-brand-600"
                            style={{
                              width: `${Math.max(
                                (product.revenue / maxProductRevenue) * 100,
                                4,
                              )}%`,
                            }}
                          />
                        </div>
                        <p className="mt-1 text-[10px] text-muted">
                          {product.qty} pcs terjual · laba{" "}
                          {formatRupiah(product.profit)}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.55fr_1fr]">
        <Card>
          <CardHeader
            title="Transaksi terbaru"
            description="5 penjualan terakhir yang dicatat"
            action={
              <Link
                href="/penjualan/transaksi"
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-700 hover:text-brand-800"
              >
                Semua penjualan <ArrowRight className="h-3 w-3" />
              </Link>
            }
          />
          <div className="p-3 sm:p-4">
            {data.recentSales.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <span className="mb-3 grid h-11 w-11 place-items-center rounded-xl bg-cream text-muted">
                  <ReceiptText className="h-5 w-5" />
                </span>
                <p className="text-sm font-semibold text-ink">
                  Belum ada transaksi
                </p>
                <p className="mt-1 text-xs text-muted">
                  Catat penjualan pertama Anda hari ini.
                </p>
                <Link
                  href="/penjualan/baru"
                  className={buttonClasses({ size: "sm", className: "mt-4" })}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Catat penjualan
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-line/70">
                {data.recentSales.map((sale) => (
                  <Link
                    key={sale.id}
                    href={`/penjualan/${sale.id}`}
                    className="flex items-center justify-between gap-3 rounded-xl px-2 py-3 transition hover:bg-cream/50"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-cream text-muted">
                        <ReceiptText className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-ink">
                          {sale.customerName || "Pelanggan umum"}
                        </p>
                        <p className="mt-0.5 text-[10px] text-muted">
                          {formatDate(sale.soldOn)} · {sale.invoiceNo}
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-xs font-bold tabular-nums text-ink">
                        {formatRupiah(sale.total)}
                      </p>
                      <p className="mt-0.5 text-[10px] text-brand-600">
                        Laba {formatRupiah(sale.profit)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </Card>

        <div className="relative overflow-hidden rounded-2xl bg-brand-800 p-5 text-cream shadow-lift sm:p-6">
          <div className="dotted-grid absolute inset-0 opacity-25" />
          <div className="absolute -right-10 -bottom-16 h-48 w-48 rounded-full bg-gold-500/10 blur-3xl" />
          <div className="relative">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gold-300">
              Ringkasan bulan ini
            </p>
            <p className="mt-2 font-display text-3xl font-semibold tracking-[-0.01em]">
              {formatRupiah(data.monthSummary.revenue)}
            </p>
            <p className="mt-1 text-xs text-brand-100/80">
              dari {data.monthSummary.transactions} transaksi ·{" "}
              {data.monthSummary.items} pcs terjual
            </p>

            <div className="mt-5 space-y-2.5 border-t border-paper/15 pt-4 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-brand-100/75">Laba kotor</span>
                <span className="font-bold tabular-nums">
                  {formatRupiah(data.monthSummary.profit)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-brand-100/75">Modal terjual</span>
                <span className="font-semibold tabular-nums text-brand-100/90">
                  {formatRupiah(data.monthSummary.cost)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-brand-100/75">Rata-rata transaksi</span>
                <span className="font-semibold tabular-nums text-brand-100/90">
                  {formatRupiah(
                    data.monthSummary.transactions > 0
                      ? Math.round(
                          data.monthSummary.revenue /
                            data.monthSummary.transactions,
                        )
                      : 0,
                  )}
                </span>
              </div>
            </div>

            <Link
              href="/laporan"
              className="mt-5 inline-flex items-center gap-1.5 text-xs font-bold text-gold-300 hover:text-gold-200"
            >
              Buka laporan lengkap <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
