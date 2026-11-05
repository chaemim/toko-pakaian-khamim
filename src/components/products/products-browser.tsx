"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Archive,
  ArchiveRestore,
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
    costPrice: number;
    sellingPrice: number;
  }[];
};

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
        {["Semua", ...categories].map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setCategory(item)}
            className={clsx(
              "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition",
              category === item
                ? "bg-brand-700 text-paper shadow-sm"
                : "border border-line bg-paper text-muted hover:border-brand-200 hover:text-brand-700",
            )}
          >
            {item}
          </button>
        ))}
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
  const prices = product.sizes.map((size) => size.sellingPrice);
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

  return (
    <div
      className={clsx(
        "group flex flex-col rounded-2xl border bg-paper p-4 shadow-card transition hover:-translate-y-0.5 hover:shadow-lift sm:p-5",
        product.isActive ? "border-line" : "border-dashed border-line opacity-75",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge tone="brand">{product.category || "Tanpa kategori"}</Badge>
            {!product.isActive ? <Badge tone="muted">Nonaktif</Badge> : null}
          </div>
          <h3 className="mt-2 truncate font-display text-lg font-semibold leading-tight text-ink">
            {product.name}
          </h3>
          <p className="mt-0.5 text-[11px] font-medium text-muted">
            {product.sizes.length} ukuran ·{" "}
            {minPrice === maxPrice
              ? formatRupiah(minPrice)
              : `${formatRupiah(minPrice)} – ${formatRupiah(maxPrice)}`}
          </p>
        </div>
        <Link
          href={`/produk/${product.id}`}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-line bg-paper text-muted transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
          aria-label={`Kelola ${product.name}`}
        >
          <Pencil className="h-4 w-4" />
        </Link>
      </div>

      <div className="mt-3.5 grid max-h-[148px] grid-cols-2 gap-1.5 overflow-y-auto pr-0.5">
        {product.sizes.map((size) => (
          <div
            key={size.id}
            className="flex items-center justify-between gap-1 rounded-lg bg-cream/60 px-2 py-1.5"
          >
            <span className="truncate text-[11px] font-bold text-ink">
              {size.label}
            </span>
            <span className="shrink-0 text-[10px] font-medium tabular-nums text-muted">
              {formatRupiah(size.sellingPrice)}
            </span>
          </div>
        ))}
        {product.sizes.length === 0 ? (
          <p className="col-span-2 text-xs text-rust-500">
            Belum ada ukuran. Klik ikon pensil untuk melengkapi.
          </p>
        ) : null}
      </div>

      <div className="mt-auto flex items-center justify-between border-t border-line/70 pt-3">
        <Link
          href={`/produk/${product.id}`}
          className="text-[11px] font-bold text-brand-700 hover:text-brand-800"
        >
          Kelola harga
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
            className="grid h-8 w-8 place-items-center rounded-lg text-muted transition hover:bg-cream hover:text-ink"
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
