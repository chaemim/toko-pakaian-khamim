import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Plus,
  ReceiptText,
  Search,
  TrendingUp,
  Wallet,
} from "lucide-react";
import clsx from "clsx";

import { requireUser } from "@/lib/auth";
import { getSalesPage } from "@/lib/queries";
import {
  addDays,
  formatDate,
  isValidDateString,
  jakartaToday,
  rangeLabel,
  startOfMonth,
} from "@/lib/date";
import { formatRupiah, paymentLabel } from "@/lib/format";
import { PageHeader } from "@/components/ui/page-header";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/field";
import { SalesNav } from "@/components/sales/sales-nav";

export const metadata = { title: "Riwayat transaksi" };

export default async function SalesPage({
  searchParams,
}: {
  searchParams: Promise<{
    from?: string;
    to?: string;
    q?: string;
    page?: string;
    status?: string;
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
  const requestedPage = Number(params.page ?? "1");
  const page = Number.isFinite(requestedPage)
    ? Math.max(1, Math.floor(requestedPage))
    : 1;

  const data = await getSalesPage({
    from,
    to,
    search,
    page,
    pageSize: 15,
  });

  const startItem =
    data.total === 0 ? 0 : (data.page - 1) * data.pageSize + 1;
  const endItem = Math.min(data.page * data.pageSize, data.total);

  function pageHref(targetPage: number) {
    const query = new URLSearchParams({ from, to });
    if (search) query.set("q", search);
    if (targetPage > 1) query.set("page", String(targetPage));
    return `/penjualan/transaksi?${query.toString()}`;
  }

  const presets = [
    { label: "Hari ini", from: today, to: today },
    { label: "7 hari", from: addDays(today, -6), to: today },
    { label: "Bulan ini", from: startOfMonth(today), to: today },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Transaksi"
        title="Riwayat transaksi"
        description="Semua transaksi yang pernah dicatat. Untuk melihat barang apa saja yang laku, buka tab Barang terjual."
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

      <SalesNav active="transaksi" />

      {params.status === "dihapus" ? (
        <Alert tone="success">Transaksi berhasil dihapus.</Alert>
      ) : null}

      <Card>
        <form
          method="get"
          action="/penjualan/transaksi"
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
                  placeholder="No. invoice atau nama pelanggan"
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
                href={`/penjualan/transaksi?from=${preset.from}&to=${preset.to}`}
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

        <div className="grid grid-cols-3 divide-x divide-line border-y border-line bg-cream/40">
          <div className="px-4 py-3">
            <p className="text-[9px] font-bold uppercase tracking-[0.08em] text-muted">
              Omzet
            </p>
            <p className="mt-0.5 truncate text-sm font-bold tabular-nums text-ink">
              {formatRupiah(data.summary.revenue)}
            </p>
          </div>
          <div className="px-4 py-3">
            <p className="text-[9px] font-bold uppercase tracking-[0.08em] text-muted">
              Laba
            </p>
            <p className="mt-0.5 truncate text-sm font-bold tabular-nums text-brand-700">
              {formatRupiah(data.summary.profit)}
            </p>
          </div>
          <div className="px-4 py-3">
            <p className="text-[9px] font-bold uppercase tracking-[0.08em] text-muted">
              Transaksi
            </p>
            <p className="mt-0.5 text-sm font-bold tabular-nums text-ink">
              {data.summary.transactions}
            </p>
          </div>
        </div>

        {data.rows.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={<ReceiptText className="h-6 w-6" />}
              title="Belum ada transaksi"
              description={
                search
                  ? "Tidak ada transaksi yang cocok dengan pencarian pada periode ini."
                  : "Transaksi pada periode ini masih kosong. Mulai catat penjualan pertama Anda."
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
                    <th className="px-4 py-3">Invoice</th>
                    <th className="px-4 py-3">Pelanggan</th>
                    <th className="px-4 py-3 text-center">Item</th>
                    <th className="px-4 py-3">Bayar</th>
                    <th className="px-4 py-3 text-right">Total</th>
                    <th className="px-4 py-3 text-right">Laba</th>
                    <th className="w-10 px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/70">
                  {data.rows.map((sale) => (
                    <tr
                      key={sale.id}
                      className="transition hover:bg-cream/40"
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/penjualan/${sale.id}`}
                          className="block"
                        >
                          <p className="text-xs font-bold text-ink">
                            {sale.invoiceNo}
                          </p>
                          <p className="mt-0.5 text-[10px] text-muted">
                            {formatDate(sale.soldOn)}
                          </p>
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-xs text-ink">
                        {sale.customerName || (
                          <span className="text-muted">Pelanggan umum</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center text-xs tabular-nums text-muted">
                        {sale.itemCount}
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone="muted">
                          {paymentLabel(sale.paymentMethod)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right text-xs font-bold tabular-nums text-ink">
                        {formatRupiah(sale.total)}
                      </td>
                      <td className="px-4 py-3 text-right text-xs font-semibold tabular-nums text-brand-600">
                        {formatRupiah(sale.profit)}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/penjualan/${sale.id}`}
                          className="grid h-8 w-8 place-items-center rounded-lg text-muted transition hover:bg-brand-50 hover:text-brand-700"
                          aria-label={`Buka ${sale.invoiceNo}`}
                        >
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-line/70 md:hidden">
              {data.rows.map((sale) => (
                <Link
                  key={sale.id}
                  href={`/penjualan/${sale.id}`}
                  className="block px-4 py-3.5 transition active:bg-cream/60"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-ink">
                        {sale.customerName || "Pelanggan umum"}
                      </p>
                      <p className="mt-0.5 text-[10px] text-muted">
                        {sale.invoiceNo} · {formatDate(sale.soldOn)}
                      </p>
                      <div className="mt-1.5 flex items-center gap-1.5">
                        <Badge tone="muted">
                          {paymentLabel(sale.paymentMethod)}
                        </Badge>
                        <span className="text-[10px] text-muted">
                          {sale.itemCount} item
                        </span>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-bold tabular-nums text-ink">
                        {formatRupiah(sale.total)}
                      </p>
                      <p className="mt-0.5 text-[10px] font-semibold text-brand-600">
                        Laba {formatRupiah(sale.profit)}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3">
              <p className="text-[10px] text-muted">
                Menampilkan {startItem}–{endItem} dari {data.total} transaksi
              </p>
              {data.totalPages > 1 ? (
                <div className="flex items-center gap-1.5">
                  {data.page > 1 ? (
                    <Link
                      href={pageHref(data.page - 1)}
                      className={buttonClasses({
                        variant: "secondary",
                        size: "sm",
                      })}
                    >
                      Sebelumnya
                    </Link>
                  ) : (
                    <span className="rounded-lg border border-line px-3 py-2 text-xs text-muted opacity-40">
                      Sebelumnya
                    </span>
                  )}
                  <span className="px-1 text-[10px] font-semibold text-muted">
                    {data.page} / {data.totalPages}
                  </span>
                  {data.page < data.totalPages ? (
                    <Link
                      href={pageHref(data.page + 1)}
                      className={buttonClasses({
                        variant: "secondary",
                        size: "sm",
                      })}
                    >
                      Berikutnya
                    </Link>
                  ) : (
                    <span className="rounded-lg border border-line px-3 py-2 text-xs text-muted opacity-40">
                      Berikutnya
                    </span>
                  )}
                </div>
              ) : null}
            </div>
          </>
        )}
      </Card>

      <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-line bg-paper px-4 py-3 text-[11px] text-muted shadow-card">
        <span className="inline-flex items-center gap-1.5">
          <Wallet className="h-3.5 w-3.5 text-brand-600" />
          Omzet dihitung dari total setelah diskon.
        </span>
        <span className="inline-flex items-center gap-1.5">
          <TrendingUp className="h-3.5 w-3.5 text-gold-600" />
          Laba = harga deal − harga beli, dikurangi diskon transaksi.
        </span>
      </div>
    </div>
  );
}
