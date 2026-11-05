import Link from "next/link";
import {
  CalendarDays,
  Download,
  ReceiptText,
  ShoppingBag,
  TrendingUp,
  Wallet,
} from "lucide-react";
import clsx from "clsx";

import { requireUser } from "@/lib/auth";
import { getReportData } from "@/lib/queries";
import {
  addDays,
  daysBetween,
  endOfMonth,
  formatDate,
  isValidDateString,
  jakartaToday,
  rangeLabel,
  startOfMonth,
} from "@/lib/date";
import {
  formatNumber,
  formatPercent,
  formatRupiah,
  paymentLabel,
} from "@/lib/format";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/field";
import { StatCard } from "@/components/dashboard/stat-card";
import { DailyChart } from "@/components/charts/daily-chart";
import { PrintButton } from "@/components/print-button";

export const metadata = { title: "Laporan" };

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  await requireUser();
  const params = await searchParams;
  const today = jakartaToday();

  let to = isValidDateString(params.to) ? params.to : today;
  let from = isValidDateString(params.from) ? params.from : startOfMonth(today);
  if (from > to) {
    const temp = from;
    from = to;
    to = temp;
  }
  if (daysBetween(from, to) > 366) {
    from = addDays(to, -365);
  }

  const data = await getReportData(from, to);
  const { summary } = data;

  const margin =
    summary.revenue > 0 ? (summary.profit / summary.revenue) * 100 : 0;
  const averageTransaction =
    summary.transactions > 0
      ? Math.round(summary.revenue / summary.transactions)
      : 0;
  const itemsPerTransaction =
    summary.transactions > 0
      ? summary.items / summary.transactions
      : 0;

  const bestDay = [...data.daily].sort((a, b) => b.revenue - a.revenue)[0];
  const maxProductRevenue = Math.max(
    ...data.topProducts.map((product) => product.revenue),
    1,
  );
  const maxCategoryRevenue = Math.max(
    ...data.categories.map((category) => category.revenue),
    1,
  );
  const maxPaymentRevenue = Math.max(
    ...data.payments.map((payment) => payment.revenue),
    1,
  );

  const currentMonthStart = startOfMonth(today);
  const lastMonthEnd = addDays(currentMonthStart, -1);
  const presets = [
    { label: "Hari ini", from: today, to: today },
    { label: "7 hari", from: addDays(today, -6), to: today },
    { label: "Bulan ini", from: currentMonthStart, to: today },
    {
      label: "Bulan lalu",
      from: startOfMonth(lastMonthEnd),
      to: endOfMonth(lastMonthEnd),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Analisis"
        title="Laporan"
        description="Pantau omzet, modal, dan laba pada periode yang Anda pilih. Unduh sebagai CSV untuk arsip."
        actions={
          <>
            <PrintButton label="Cetak" />
            <a
              href={`/api/laporan/csv?from=${from}&to=${to}`}
              className={buttonClasses({ variant: "primary" })}
            >
              <Download className="h-4 w-4" />
              Ekspor CSV
            </a>
          </>
        }
      />

      <Card>
        <form
          method="get"
          action="/laporan"
          className="flex flex-col gap-3 border-b border-line/80 p-4 lg:flex-row lg:items-end"
        >
          <div className="grid flex-1 grid-cols-2 gap-2 sm:max-w-md">
            <div>
              <label
                htmlFor="from"
                className="mb-1 block text-[10px] font-bold uppercase tracking-[0.08em] text-muted"
              >
                Dari tanggal
              </label>
              <Input
                id="from"
                type="date"
                name="from"
                defaultValue={from}
                max={today}
              />
            </div>
            <div>
              <label
                htmlFor="to"
                className="mb-1 block text-[10px] font-bold uppercase tracking-[0.08em] text-muted"
              >
                Sampai
              </label>
              <Input
                id="to"
                type="date"
                name="to"
                defaultValue={to}
                max={today}
              />
            </div>
          </div>
          <button
            type="submit"
            className={buttonClasses({ variant: "secondary" })}
          >
            Terapkan filter
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-1.5 px-4 py-3">
          <span className="mr-1 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.08em] text-muted">
            <CalendarDays className="h-3.5 w-3.5" />
            Periode
          </span>
          {presets.map((preset) => {
            const active = preset.from === from && preset.to === to;
            return (
              <Link
                key={preset.label}
                href={`/laporan?from=${preset.from}&to=${preset.to}`}
                className={clsx(
                  "rounded-full px-2.5 py-1 text-[10px] font-semibold transition",
                  active
                    ? "bg-brand-700 text-paper"
                    : "bg-cream text-muted hover:bg-brand-50 hover:text-brand-700",
                )}
              >
                {preset.label}
              </Link>
            );
          })}
          <span className="ml-auto text-[10px] font-medium text-muted">
            {rangeLabel(from, to)}
          </span>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard
          title="Omzet"
          value={formatRupiah(summary.revenue)}
          icon={<Wallet className="h-[18px] w-[18px]" />}
          footer={
            <span className="text-[11px] text-muted">
              {summary.transactions} transaksi · {summary.items} pcs
            </span>
          }
        />
        <StatCard
          title="Modal barang"
          value={formatRupiah(summary.cost)}
          icon={<ShoppingBag className="h-[18px] w-[18px]" />}
          tone="ink"
          footer={
            <span className="text-[11px] text-muted">
              Harga beli barang yang terjual
            </span>
          }
        />
        <StatCard
          title="Laba kotor"
          value={formatRupiah(summary.profit)}
          icon={<TrendingUp className="h-[18px] w-[18px]" />}
          tone="gold"
          footer={
            <>
              <Badge tone={margin >= 0 ? "brand" : "danger"}>
                {formatPercent(margin, 1)} dari omzet
              </Badge>
            </>
          }
        />
        <StatCard
          title="Rata-rata transaksi"
          value={formatRupiah(averageTransaction)}
          icon={<ReceiptText className="h-[18px] w-[18px]" />}
          footer={
            <span className="text-[11px] text-muted">
              {formatNumber(itemsPerTransaction)} item per transaksi
            </span>
          }
        />
      </div>

      <Card>
        <CardHeader
          title="Tren harian"
          description="Omzet dan laba per hari pada periode ini"
          action={
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted">
                Total periode
              </p>
              <p className="mt-0.5 text-sm font-bold tabular-nums text-ink">
                {formatRupiah(summary.revenue)}
              </p>
            </div>
          }
        />
        <div className="p-4 sm:p-5">
          <DailyChart data={data.daily} height="h-44" />
        </div>
      </Card>

      <div className="grid items-start gap-4 xl:grid-cols-[1.45fr_1fr]">
        <Card>
          <CardHeader
            title="Produk terlaris"
            description="Diurutkan berdasarkan omzet pada periode ini"
          />
          {data.topProducts.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-muted">
              Belum ada penjualan pada periode ini.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-line text-[10px] font-bold uppercase tracking-[0.08em] text-muted">
                    <th className="w-10 px-4 py-2.5">#</th>
                    <th className="px-4 py-2.5">Produk</th>
                    <th className="px-4 py-2.5 text-center">Qty</th>
                    <th className="px-4 py-2.5 text-right">Omzet</th>
                    <th className="px-4 py-2.5 text-right">Laba</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/70">
                  {data.topProducts.slice(0, 10).map((product, index) => (
                    <tr key={`${product.productId}-${product.productName}`}>
                      <td className="px-4 py-3">
                        <span
                          className={clsx(
                            "grid h-6 w-6 place-items-center rounded-md text-[10px] font-bold",
                            index === 0
                              ? "bg-gold-100 text-gold-700"
                              : "bg-cream text-muted",
                          )}
                        >
                          {index + 1}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs font-semibold text-ink">
                          {product.productName}
                        </p>
                        <div className="mt-1 h-1 w-24 overflow-hidden rounded-full bg-cream">
                          <div
                            className="h-full rounded-full bg-brand-500"
                            style={{
                              width: `${Math.max(
                                (product.revenue / maxProductRevenue) * 100,
                                3,
                              )}%`,
                            }}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center text-xs tabular-nums text-muted">
                        {product.qty}
                      </td>
                      <td className="px-4 py-3 text-right text-xs font-semibold tabular-nums text-ink">
                        {formatRupiah(product.revenue)}
                      </td>
                      <td className="px-4 py-3 text-right text-xs font-semibold tabular-nums text-brand-600">
                        {formatRupiah(product.profit)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader
              title="Per kategori"
              description="Kontribusi omzet tiap kategori"
            />
            <div className="space-y-4 p-4 sm:p-5">
              {data.categories.length === 0 ? (
                <p className="py-4 text-center text-xs text-muted">
                  Belum ada data kategori.
                </p>
              ) : (
                data.categories.map((category) => (
                  <div key={category.category}>
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="truncate text-xs font-semibold text-ink">
                        {category.category}
                      </p>
                      <p className="shrink-0 text-[11px] font-bold tabular-nums text-ink">
                        {formatRupiah(category.revenue)}
                      </p>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-cream">
                      <div
                        className="h-full rounded-full bg-gold-500"
                        style={{
                          width: `${Math.max(
                            (category.revenue / maxCategoryRevenue) * 100,
                            3,
                          )}%`,
                        }}
                      />
                    </div>
                    <p className="mt-1 text-[10px] text-muted">
                      {category.qty} pcs · laba {formatRupiah(category.profit)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Metode pembayaran"
              description="Total uang masuk per metode"
            />
            <div className="space-y-3 p-4 sm:p-5">
              {data.payments.length === 0 ? (
                <p className="py-3 text-center text-xs text-muted">
                  Belum ada transaksi.
                </p>
              ) : (
                data.payments.map((payment) => (
                  <div key={payment.method}>
                    <div className="flex items-center justify-between gap-2">
                      <Badge tone="muted">{paymentLabel(payment.method)}</Badge>
                      <span className="text-[11px] font-bold tabular-nums text-ink">
                        {formatRupiah(payment.revenue)}
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-cream">
                      <div
                        className="h-full rounded-full bg-brand-600"
                        style={{
                          width: `${Math.max(
                            (payment.revenue / maxPaymentRevenue) * 100,
                            3,
                          )}%`,
                        }}
                      />
                    </div>
                    <p className="mt-1 text-[10px] text-muted">
                      {payment.transactions} transaksi
                    </p>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card className="overflow-hidden">
            <div className="bg-cream/60 p-4 text-xs leading-relaxed text-muted">
              <p className="font-semibold text-ink">Hari terbaik</p>
              {bestDay && bestDay.revenue > 0 ? (
                <p className="mt-1">
                  {formatDate(bestDay.date)} dengan omzet{" "}
                  <span className="font-bold text-brand-700">
                    {formatRupiah(bestDay.revenue)}
                  </span>
                </p>
              ) : (
                <p className="mt-1">Belum ada transaksi pada periode ini.</p>
              )}
            </div>
          </Card>
        </div>
      </div>

      <p className="px-1 text-[10px] leading-relaxed text-muted">
        Laba kotor dihitung dari harga deal dikurangi harga beli, lalu dikurangi
        diskon transaksi. Angka ini belum memperhitungkan biaya operasional
        seperti sewa lapak atau transport.
      </p>
    </div>
  );
}
