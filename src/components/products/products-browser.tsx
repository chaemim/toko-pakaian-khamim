"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Archive,
  ArchiveRestore,
  ChevronRight,
  Pencil,
  Plus,
  Search,
  Shirt,
  X,
} from "lucide-react";
import clsx from "clsx";

import { toggleProductAction } from "@/actions/products";
import { ConfirmForm } from "@/components/confirm-form";
import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/empty-state";
import { formatRupiah } from "@/lib/format";

export type ProductListItem = {
  id: string;
  name: string;
  category: string | null;
  isActive: boolean;
  sizes: {
    id: string;
    label: string;
    /** Harga beli (modal). Harga jual hanya dikelola di halaman produk. */
    costPrice: number;
  }[];
};

const VISIBLE_SIZES = 8;

export function ProductsBrowser({
  products,
  categories,
}: {
  products: ProductListItem[];
  categories: string[];
}) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Semua");

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return products.filter((product) => {
      if (category !== "Semua" && (product.category ?? "Tanpa kategori") !== category) {
        return false;
      }
      if (!keyword) return true;
      return (
        product.name.toLowerCase().includes(keyword) ||
        (product.category ?? "").toLowerCase().includes(keyword) ||
        product.sizes.some((size) =>
          size.label.toLowerCase().includes(keyword),
        )
      );
    });
  }, [products, search, category]);

  const activeCount = products.filter((product) => product.isActive).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-2xl border border-line bg-paper p-3 shadow-card sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Cari nama produk, kategori, atau ukuran…"
            className="border-transparent bg-cream/60 pl-10 focus:bg-paper"
            aria-label="Cari produk"
          />
          {search ? (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-muted hover:bg-paper"
              aria-label="Hapus pencarian"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
        <p className="shrink-0 px-1 text-[11px] font-medium text-muted">
          {activeCount} produk aktif · {products.length} total
        </p>
      </div>

      <div className="hide-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
        {["Semua", ...categories].map((item) => {
          const count =
            item === "Semua"
              ? products.length
              : products.filter((product) => product.category === item).length;
          return (
            <button
              key={item}
              type="button"
              onClick={() => setCategory(item)}
              className={clsx(
                "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition",
                category === item
                  ? "bg-brand-700 text-paper shadow-sm"
                  : "border border-line bg-paper text-muted hover:border-brand-200 hover:text-brand-700",
              )}
            >
              {item}
              <span
                className={clsx(
                  "rounded-full px-1.5 py-px text-[10px] font-bold tabular-nums",
                  category === item
                    ? "bg-paper/20 text-paper"
                    : "bg-cream text-muted",
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {products.length === 0 ? (
        <EmptyState
          icon={<Shirt className="h-6 w-6" />}
          title="Belum ada produk"
          description="Tambahkan pakaian yang Anda jual beserta ukuran dan harganya. Produk akan muncul di halaman catat penjualan."
          action={
            <Link
              href="/produk/baru"
              className={buttonClasses({ size: "md" })}
            >
              <Plus className="h-4 w-4" />
              Tambah produk
            </Link>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Search className="h-6 w-6" />}
          title="Produk tidak ditemukan"
          description="Coba kata kunci atau kategori lain."
          action={
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setCategory("Semua");
              }}
              className={buttonClasses({ variant: "secondary", size: "sm" })}
            >
              Reset filter
            </button>
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}

function ProductCard({ product }: { product: ProductListItem }) {
  const costs = product.sizes.map((size) => size.costPrice);
  const minCost = costs.length > 0 ? Math.min(...costs) : 0;
  const maxCost = costs.length > 0 ? Math.max(...costs) : 0;
  const shownSizes = product.sizes.slice(0, VISIBLE_SIZES);
  const hiddenSizes = product.sizes.length - shownSizes.length;

  return (
    <div
      className={clsx(
        "group flex flex-col overflow-hidden rounded-2xl border bg-paper shadow-card transition hover:-translate-y-0.5 hover:shadow-lift",
        product.isActive ? "border-line" : "border-dashed border-line opacity-75",
      )}
    >
      <div className="flex items-start gap-3 p-4 pb-3 sm:p-5 sm:pb-3">
        <span
          aria-hidden
          className={clsx(
            "grid h-11 w-11 shrink-0 place-items-center rounded-xl font-display text-lg font-semibold",
            product.isActive
              ? "bg-brand-700 text-paper"
              : "bg-cream text-muted",
          )}
        >
          {product.name.trim().charAt(0).toUpperCase() || "?"}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 font-display text-[17px] font-semibold leading-snug text-ink">
            {product.name}
          </h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <Badge tone="brand">{product.category || "Tanpa kategori"}</Badge>
            {!product.isActive ? <Badge tone="muted">Nonaktif</Badge> : null}
          </div>
        </div>
        <Link
          href={`/produk/${product.id}`}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-line bg-paper text-muted transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
          aria-label={`Kelola ${product.name}`}
        >
          <Pencil className="h-4 w-4" />
        </Link>
      </div>

      <div className="mx-4 flex items-center justify-between gap-3 rounded-xl bg-gold-50 px-3.5 py-2.5 sm:mx-5">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-gold-700">
            Harga beli
          </p>
          <p className="mt-0.5 truncate text-sm font-bold tabular-nums text-ink">
            {product.sizes.length === 0
              ? "–"
              : minCost === maxCost
                ? formatRupiah(minCost)
                : `${formatRupiah(minCost)} – ${formatRupiah(maxCost)}`}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-paper px-2.5 py-1 text-[10px] font-bold text-muted">
          {product.sizes.length} ukuran
        </span>
      </div>

      <div className="px-4 pt-3 sm:px-5">
        {product.sizes.length === 0 ? (
          <p className="rounded-lg bg-rust-50 px-3 py-2 text-xs text-rust-600">
            Belum ada ukuran. Klik ikon pensil untuk melengkapi.
          </p>
        ) : (
          <ul className="grid grid-cols-2 gap-1.5">
            {shownSizes.map((size) => (
              <li
                key={size.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-line/80 bg-cream/40 px-2.5 py-2"
              >
                <span className="truncate text-[12px] font-bold text-ink">
                  {size.label}
                </span>
                <span className="shrink-0 text-[11px] font-semibold tabular-nums text-muted">
                  {formatRupiah(size.costPrice)}
                </span>
              </li>
            ))}
            {hiddenSizes > 0 ? (
              <li className="col-span-2">
                <Link
                  href={`/produk/${product.id}`}
                  className="block rounded-lg border border-dashed border-line px-2.5 py-2 text-center text-[11px] font-semibold text-brand-700 transition hover:bg-brand-50"
                >
                  +{hiddenSizes} ukuran lainnya
                </Link>
              </li>
            ) : null}
          </ul>
        )}
      </div>

      <div className="mt-auto flex items-center justify-between border-t border-line/70 px-4 py-3 sm:px-5">
        <Link
          href={`/produk/${product.id}`}
          className="inline-flex items-center gap-1 text-[12px] font-bold text-brand-700 hover:text-brand-800"
        >
          Kelola harga
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
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
            title={product.isActive ? "Nonaktifkan produk" : "Aktifkan produk"}
            aria-label={
              product.isActive ? "Nonaktifkan produk" : "Aktifkan produk"
            }
            className="grid h-9 w-9 place-items-center rounded-lg text-muted transition hover:bg-cream hover:text-ink"
          >
            {product.isActive ? (
              <Archive className="h-4 w-4" />
            ) : (
              <ArchiveRestore className="h-4 w-4" />
            )}
          </button>
        </ConfirmForm>
      </div>
    </div>
  );
}
