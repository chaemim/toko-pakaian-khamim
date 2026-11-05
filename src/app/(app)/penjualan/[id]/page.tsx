import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Plus,
  ReceiptText,
  ShieldAlert,
  TrendingUp,
  Trash2,
} from "lucide-react";

import { requireUser } from "@/lib/auth";
import { getSaleWithItems, getStoreSettings } from "@/lib/queries";
import { formatDateLong, formatDateTime } from "@/lib/date";
import { formatRupiah, paymentLabel } from "@/lib/format";
import { PageHeader } from "@/components/ui/page-header";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PrintButton } from "@/components/print-button";
import { ConfirmForm } from "@/components/confirm-form";
import { deleteSaleAction } from "@/actions/sales";

export const metadata = { title: "Detail penjualan" };

export default async function SaleDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ baru?: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const query = await searchParams;
  const [sale, store] = await Promise.all([
    getSaleWithItems(id),
    getStoreSettings(),
  ]);

  if (!sale) notFound();

  const itemCount = sale.items.reduce((sum, item) => sum + item.qty, 0);
  const isNew = query.baru === "1";

  return (
    <div className="space-y-5">
      <div className="no-print">
        <PageHeader
          eyebrow={sale.invoiceNo}
          title="Detail penjualan"
          description={`Dicatat pada ${formatDateLong(sale.soldOn)} oleh ${
            sale.createdByName || "pengguna"
          }.`}
          actions={
            <>
              <Link
                href="/penjualan/transaksi"
                className={buttonClasses({ variant: "secondary" })}
              >
                <ArrowLeft className="h-4 w-4" />
                Kembali
              </Link>
              <PrintButton label="Cetak struk" variant="primary" />
            </>
          }
        />
      </div>

      {isNew ? (
        <Alert tone="success" className="no-print">
          <span className="flex items-center gap-1.5 font-semibold">
            <CheckCircle2 className="h-4 w-4" />
            Penjualan berhasil disimpan.
          </span>{" "}
          Anda bisa langsung mencetak struk atau mencatat transaksi berikutnya.
        </Alert>
      ) : null}

      <div className="mx-auto w-full max-w-3xl space-y-4">
        <Card className="print-card overflow-hidden">
          <div className="border-b border-line px-5 py-6 text-center sm:px-8">
            <p className="font-display text-xl font-semibold text-ink">
              {store.storeName}
            </p>
            {store.tagline ? (
              <p className="mt-0.5 text-[11px] text-muted">{store.tagline}</p>
            ) : null}
            <p className="mt-1 text-[10px] text-muted">
              {[store.address, store.phone].filter(Boolean).join(" · ")}
            </p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-brand-700">
              <ReceiptText className="h-3 w-3" />
              Bukti penjualan
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-3 border-b border-dashed border-line px-5 py-5 text-xs sm:grid-cols-4 sm:px-8">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.08em] text-muted">
                No. invoice
              </p>
              <p className="mt-0.5 font-semibold text-ink">{sale.invoiceNo}</p>
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.08em] text-muted">
                Tanggal
              </p>
              <p className="mt-0.5 font-semibold text-ink">
                {formatDateLong(sale.soldOn)}
              </p>
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.08em] text-muted">
                Pelanggan
              </p>
              <p className="mt-0.5 font-semibold text-ink">
                {sale.customerName || "Pelanggan umum"}
              </p>
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.08em] text-muted">
                Pembayaran
              </p>
              <p className="mt-0.5 font-semibold text-ink">
                {paymentLabel(sale.paymentMethod)}
              </p>
            </div>
          </div>

          <div className="divide-y divide-line/70 px-5 sm:px-8">
            {sale.items.map((item) => (
              <div
                key={item.id}
                className="flex items-start justify-between gap-3 py-3.5"
              >
                <div className="min-w-0">
                  <p className="text-xs font-bold text-ink">
                    {item.productName}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    {item.sizeLabel ? (
                      <Badge tone="muted">{item.sizeLabel}</Badge>
                    ) : null}
                    {item.unitPrice !== item.listPrice ? (
                      <span className="text-[10px] text-muted">
                        Nego dari{" "}
                        <span className="line-through">
                          {formatRupiah(item.listPrice)}
                        </span>
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-xs font-semibold tabular-nums text-ink">
                    {item.qty} × {formatRupiah(item.unitPrice)}
                  </p>
                  <p className="mt-1 text-sm font-bold tabular-nums text-ink">
                    {formatRupiah(item.subtotal)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-dashed border-line px-5 py-4 sm:px-8">
            <div className="ml-auto max-w-xs space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted">Subtotal ({itemCount} pcs)</span>
                <span className="font-semibold tabular-nums text-ink">
                  {formatRupiah(sale.subtotal)}
                </span>
              </div>
              {sale.discount > 0 ? (
                <div className="flex items-center justify-between">
                  <span className="text-muted">Diskon</span>
                  <span className="font-semibold tabular-nums text-rust-500">
                    − {formatRupiah(sale.discount)}
                  </span>
                </div>
              ) : null}
              <div className="flex items-baseline justify-between border-t border-line pt-2.5">
                <span className="text-sm font-bold text-ink">Total</span>
                <span className="font-display text-2xl font-semibold tabular-nums text-ink">
                  {formatRupiah(sale.total)}
                </span>
              </div>
            </div>
          </div>

          {sale.note ? (
            <div className="border-t border-line bg-cream/40 px-5 py-3 text-[11px] text-muted sm:px-8">
              <span className="font-semibold text-ink">Catatan: </span>
              {sale.note}
            </div>
          ) : null}

          <div className="border-t border-line px-5 py-4 text-center text-[10px] leading-relaxed text-muted sm:px-8">
            {store.receiptNote ||
              "Terima kasih sudah berbelanja. Barang yang sudah dibeli tidak dapat ditukar tanpa kesepakatan."}
            <p className="mt-1 text-[9px] text-muted/70">
              Dicatat {formatDateTime(sale.createdAt)}
            </p>
          </div>
        </Card>

        <Card className="no-print border-brand-100 bg-brand-50/50">
          <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-100 text-brand-700">
                <TrendingUp className="h-4 w-4" />
              </span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-brand-700">
                  Ringkasan internal
                </p>
                <p className="mt-0.5 text-xs text-brand-800">
                  Modal {formatRupiah(sale.totalCost)} · Laba{" "}
                  <span className="font-bold">{formatRupiah(sale.profit)}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/penjualan/baru"
                className={buttonClasses({ variant: "secondary", size: "sm" })}
              >
                <Plus className="h-3.5 w-3.5" />
                Catat lagi
              </Link>
              <Link
                href="/laporan"
                className={buttonClasses({ variant: "ghost", size: "sm" })}
              >
                Lihat laporan
              </Link>
            </div>
          </div>
        </Card>

        {user.role === "owner" ? (
          <Card className="no-print border-rust-100">
            <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-[11px] leading-relaxed text-muted">
                <ShieldAlert className="h-4 w-4 shrink-0 text-rust-500" />
                Menghapus transaksi akan mengurangi omzet dan laba pada laporan.
              </div>
              <ConfirmForm
                action={deleteSaleAction}
                confirmMessage={`Hapus transaksi ${sale.invoiceNo}? Tindakan ini tidak dapat dibatalkan.`}
                className="shrink-0"
              >
                <input type="hidden" name="id" value={sale.id} />
                <button
                  type="submit"
                  className={buttonClasses({
                    variant: "secondary",
                    size: "sm",
                    className:
                      "w-full border-rust-100 text-rust-600 hover:border-rust-200 hover:bg-rust-50",
                  })}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Hapus transaksi
                </button>
              </ConfirmForm>
            </div>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
