import Link from "next/link";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  Shirt,
  TrendingUp,
  Wallet,
} from "lucide-react";
import clsx from "clsx";

import { requireUser } from "@/lib/auth";
import { getSoldItems } from "@/lib/queries";
import {
  addDays,
  formatDate,
  isValidDateString,
  jakartaToday,
  rangeLabel,
  startOfMonth,
} from "@/lib/date";
import { formatRupiah } from "@/lib/format";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/field";
import { SalesNav } from "@/components/sales/sales-nav";

export const metadata = { title: "Barang terjual" };

export default async function SoldItemsPage({
  searchParams,
}: {
  searchParams: Promise<{
    from?: string;
    to?: string;
    q?: string;
  }>;
}) {
  await requireUser();
  const params = await searchParams;
  const today = jakartaToday();

  let from = isValidDateString(params.from)
    ? params.from
    : startOfMonth(today);
  let to = isValidDateString(params.to) ? params.to : today;
  if (from > to) {
    const temp = from;
    from = to;
    to = temp;
  }

  const search = (params.q ?? "").trim().slice(0, 80);
  const soldItems = await getSoldItems({ from, to, search });

  const totals = soldItems.reduce(
    (sum, item) => ({
      qty: sum.qty + item.qty,
      revenue: sum.revenue + item.revenue,
      profit: sum.profit + item.profit,
    }),
    { qty: 0, revenue: 0, profit: 0 },
  );

  const presets = [
    { label: "Hari ini", from: today, to: today },
    { label: "Bulan ini", from: startOfMonth(today), to: today },
  ];

  // Navigasi per hari: < > bergeser satu hari dari tanggal akhir periode.
  const singleDay = from === to;
  const prevDay = addDays(to, -1);
  const nextDay = addDays(to, 1);
  const canGoNext = to < today;

  let dayCaption = "Periode";
  if (singleDay) {
    if (to === today) dayCaption = "Hari ini";
    else if (to === addDays(today, -1)) dayCaption = "Kemarin";
    else dayCaption = formatDate(to, { weekday: "long", day: undefined, month: undefined, year: undefined });
  }

  function presetHref(presetFrom: string, presetTo: string) {
    const query = new URLSearchParams({ from: presetFrom, to: presetTo });
    if (search) query.set("q", search);
    return `/penjualan?${query.toString()}`;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Penjualan"
        title="Barang terjual"
        description="Lihat barang apa saja yang laku pada periode ini. Satu baris menggabungkan barang dan ukuran yang sama."
        actions={
          <Link
            href="/penjualan/baru"
            className={buttonClasses({ variant: "primary" })}
          >
            <Plus className="h-4 w-4" />
            Catat penjualan
          </Link>
        }
      />

      <SalesNav active="barang" />

      <Card>
        <form
          method="get"
          action="/penjualan"
          className="flex flex-col gap-3 border-b border-line/80 p-4 lg:flex-row lg:items-end"
        >
          <div className="grid flex-1 grid-cols-2 gap-2 sm:grid-cols-[1fr_1fr_1.4fr]">
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
            <div className="col-span-2 sm:col-span-1">
              <label
                htmlFor="q"
                className="mb-1 block text-[10px] font-bold uppercase tracking-[0.08em] text-muted"
              >
                Cari
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <Input
                  id="q"
                  name="q"
                  defaultValue={search}
                  placeholder="Nama barang atau ukuran"
                  className="pl-9"
                />
              </div>
            </div>
          </div>
          <button
            type="submit"
            className={buttonClasses({ variant: "secondary" })}
          >
            Terapkan filter
          </button>
        </form>

        <div className="space-y-3 px-4 py-3.5">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex w-full items-center justify-between rounded-xl border border-line bg-paper p-1 shadow-card sm:w-72">
              <Link
                href={presetHref(prevDay, prevDay)}
                aria-label="Hari sebelumnya"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-brand-700 transition hover:bg-brand-50 active:scale-95"
              >
                <ChevronLeft className="h-5 w-5" />
              </Link>
              <div className="min-w-0 px-2 text-center leading-tight">
                <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted">
                  {dayCaption}
                </p>
                <p className="mt-0.5 truncate text-xs font-bold text-ink">
                  {rangeLabel(from, to)}
                </p>
              </div>
              {canGoNext ? (
                <Link
                  href={presetHref(nextDay, nextDay)}
                  aria-label="Hari berikutnya"
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-brand-700 transition hover:bg-brand-50 active:scale-95"
                >
                  <ChevronRight className="h-5 w-5" />
                </Link>
              ) : (
                <span
                  aria-disabled="true"
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-muted opacity-30"
                >
                  <ChevronRight className="h-5 w-5" />
                </span>
              )}
            </div>

            {presets.map((preset) => {
              const active = preset.from === from && preset.to === to;
              return (
                <Link
                  key={preset.label}
                  href={presetHref(preset.from, preset.to)}
                  className={clsx(
                    "rounded-full px-3 py-2 text-[11px] font-semibold transition",
                    active
                      ? "bg-brand-700 text-paper"
                      : "bg-cream text-muted hover:bg-brand-50 hover:text-brand-700",
                  )}
                >
                  {preset.label}
                </Link>
              );
            })}
          </div>
          <p className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted">
            <CalendarDays className="h-3.5 w-3.5" />
            {singleDay ? "Per hari" : "Rentang tanggal"} · {soldItems.length} jenis barang
          </p>
        </div>

        <div className="grid grid-cols-3 divide-x divide-line border-y border-line bg-cream/40">
          <div className="px-4 py-3">
            <p className="text-[9px] font-bold uppercase tracking-[0.08em] text-muted">
              Barang terjual
            </p>
            <p className="mt-0.5 text-sm font-bold tabular-nums text-ink">
              {totals.qty} pcs
            </p>
          </div>
          <div className="px-4 py-3">
            <p className="text-[9px] font-bold uppercase tracking-[0.08em] text-muted">
              Omzet
            </p>
            <p className="mt-0.5 truncate text-sm font-bold tabular-nums text-ink">
              {formatRupiah(totals.revenue)}
            </p>
          </div>
          <div className="px-4 py-3">
            <p className="text-[9px] font-bold uppercase tracking-[0.08em] text-muted">
              Laba
            </p>
            <p className="mt-0.5 truncate text-sm font-bold tabular-nums text-brand-700">
              {formatRupiah(totals.profit)}
            </p>
          </div>
        </div>

        {soldItems.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={<Shirt className="h-6 w-6" />}
              title={
                search ? "Barang tidak ditemukan" : "Belum ada barang terjual"
              }
              description={
                search
                  ? "Tidak ada barang yang cocok dengan pencarian pada periode ini."
                  : "Belum ada barang yang tercatat terjual pada periode ini."
              }
              action={
                <Link
                  href="/penjualan/baru"
                  className={buttonClasses({ size: "md" })}
                >
                  <Plus className="h-4 w-4" />
                  Catat penjualan
                </Link>
              }
            />
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-line text-[10px] font-bold uppercase tracking-[0.08em] text-muted">
                    <th className="px-4 py-3">Barang</th>
                    <th className="px-4 py-3">Item</th>
                    <th className="px-4 py-3 text-right">Harga</th>
                    <th className="px-4 py-3 text-right">Laba</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/70">
                  {soldItems.map((item) => (
                    <tr
                      key={`${item.productId ?? item.productName}-${item.sizeLabel ?? "all"}`}
                      className="transition hover:bg-cream/40"
                    >
                      <td className="px-4 py-3">
                        <p className="text-xs font-bold text-ink">
                          {item.productName}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge tone="muted">
                            {item.sizeLabel || "All size"}
                          </Badge>
                          <span className="text-[10px] font-medium text-muted">
                            {item.qty} pcs
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-xs font-bold tabular-nums text-ink">
                        {formatRupiah(item.revenue)}
                      </td>
                      <td
                        className={clsx(
                          "px-4 py-3 text-right text-xs font-semibold tabular-nums",
                          item.profit >= 0
                            ? "text-brand-600"
                            : "text-rust-600",
                        )}
                      >
                        {formatRupiah(item.profit)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-line/70 md:hidden">
              {soldItems.map((item) => (
                <div
                  key={`${item.productId ?? item.productName}-${item.sizeLabel ?? "all"}`}
                  className="flex items-start justify-between gap-3 px-4 py-3.5"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-ink">
                      {item.productName}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <Badge tone="muted">
                        {item.sizeLabel || "All size"}
                      </Badge>
                      <span className="text-[10px] font-medium text-muted">
                        {item.qty} pcs
                      </span>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-bold tabular-nums text-ink">
                      {formatRupiah(item.revenue)}
                    </p>
                    <p
                      className={clsx(
                        "mt-0.5 text-[10px] font-semibold",
                        item.profit >= 0
                          ? "text-brand-600"
                          : "text-rust-600",
                      )}
                    >
                      Laba {formatRupiah(item.profit)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>

      <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-line bg-paper px-4 py-3 text-[11px] text-muted shadow-card">
        <span className="inline-flex items-center gap-1.5">
          <Wallet className="h-3.5 w-3.5 text-brand-600" />
          Harga dan laba adalah total untuk barang tersebut, sudah dikurangi
          diskon transaksi.
        </span>
        <span className="inline-flex items-center gap-1.5">
          <TrendingUp className="h-3.5 w-3.5 text-gold-600" />
          Satu baris = satu barang + ukuran pada periode ini.
        </span>
      </div>
    </div>
  );
}
