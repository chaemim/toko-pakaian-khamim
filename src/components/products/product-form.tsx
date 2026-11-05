"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Info,
  Loader2,
  Plus,
  Save,
  Tag,
  Trash2,
  Wand2,
} from "lucide-react";
import clsx from "clsx";

import {
  createProductAction,
  updateProductAction,
} from "@/actions/products";
import { Alert } from "@/components/ui/alert";
import { buttonClasses } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Input, Label, MoneyInput, Textarea } from "@/components/ui/field";
import { formatNumber, formatPercent, formatRupiah } from "@/lib/format";
import { EMPTY_ACTION_STATE, firstError } from "@/lib/types";

type SizeRow = {
  key: string;
  label: string;
  cost: string;
  selling: string;
};

export type ProductFormData = {
  id: string;
  name: string;
  category: string | null;
  notes: string | null;
  sizes: {
    id: string;
    label: string;
    costPrice: number;
    sellingPrice: number;
  }[];
};

function uid() {
  return Math.random().toString(36).slice(2);
}

function onlyDigits(value: string) {
  return value.replace(/\D/g, "").slice(0, 12);
}

function displayDigits(value: string) {
  return value ? formatNumber(Number(value)) : "";
}

const quickSizeOptions = ["S", "M", "L", "XL", "XXL", "All size"];

export function ProductForm({
  mode,
  product,
  categories,
}: {
  mode: "create" | "edit";
  product?: ProductFormData;
  categories: string[];
}) {
  const [state, formAction, pending] = useActionState(
    mode === "edit" ? updateProductAction : createProductAction,
    EMPTY_ACTION_STATE,
  );

  const [name, setName] = useState(product?.name ?? "");
  const [category, setCategory] = useState(product?.category ?? "");
  const [notes, setNotes] = useState(product?.notes ?? "");
  const [sizes, setSizes] = useState<SizeRow[]>(
    product && product.sizes.length > 0
      ? product.sizes.map((size) => ({
          key: size.id,
          label: size.label,
          cost: String(size.costPrice),
          selling: String(size.sellingPrice),
        }))
      : [{ key: uid(), label: "", cost: "", selling: "" }],
  );

  function updateSize(key: string, field: keyof SizeRow, value: string) {
    setSizes((current) =>
      current.map((row) =>
        row.key === key
          ? {
              ...row,
              [field]:
                field === "label" ? value : onlyDigits(value),
            }
          : row,
      ),
    );
  }

  function addSize(label = "") {
    setSizes((current) => {
      const existing = current.some(
        (row) => row.label.trim().toLowerCase() === label.trim().toLowerCase() && label,
      );
      if (label && existing) return current;

      const lastWithPrice = [...current]
        .reverse()
        .find((row) => row.cost || row.selling);

      const emptyIndex = current.findIndex(
        (row) => !row.label && !row.cost && !row.selling,
      );

      if (emptyIndex >= 0) {
        return current.map((row, index) =>
          index === emptyIndex
            ? {
                ...row,
                label,
                cost: lastWithPrice?.cost ?? "",
                selling: lastWithPrice?.selling ?? "",
              }
            : row,
        );
      }

      return [
        ...current,
        {
          key: uid(),
          label,
          cost: lastWithPrice?.cost ?? "",
          selling: lastWithPrice?.selling ?? "",
        },
      ];
    });
  }

  function removeSize(key: string) {
    setSizes((current) => {
      if (current.length <= 1) {
        return current.map((row) => ({
          ...row,
          label: "",
          cost: "",
          selling: "",
        }));
      }
      return current.filter((row) => row.key !== key);
    });
  }

  const payloadSizes = sizes
    .filter((row) => row.label.trim() || row.cost || row.selling)
    .map((row) => ({
      label: row.label.trim(),
      costPrice: Number(row.cost || 0),
      sellingPrice: Number(row.selling || 0),
    }));

  const filled = sizes.filter((row) => row.label.trim());
  const prices = filled
    .map((row) => Number(row.selling || 0))
    .filter((price) => price > 0);
  const minPrice = prices.length ? Math.min(...prices) : 0;
  const maxPrice = prices.length ? Math.max(...prices) : 0;
  const totalSelling = filled.reduce(
    (sum, row) => sum + Number(row.selling || 0),
    0,
  );
  const totalProfit = filled.reduce(
    (sum, row) =>
      sum + (Number(row.selling || 0) - Number(row.cost || 0)),
    0,
  );
  const margin = totalSelling > 0 ? (totalProfit / totalSelling) * 100 : 0;

  const suggestedCategories = useMemo(() => {
    const defaults = ["Seragam Sekolah", "Baju", "Celana", "Aksesoris"];
    return [...new Set([...categories, ...defaults])].slice(0, 8);
  }, [categories]);

  return (
    <form
      action={formAction}
      className="grid items-start gap-5 xl:grid-cols-[1.5fr_1fr]"
    >
      {product ? <input type="hidden" name="id" value={product.id} /> : null}
      <input type="hidden" name="sizes" value={JSON.stringify(payloadSizes)} />

      <div className="space-y-5">
        {state.error ? <Alert tone="error">{state.error}</Alert> : null}

        <Card>
          <CardHeader
            title="Informasi produk"
            description="Nama dan kategori membantu Anda menemukan produk dengan cepat."
          />
          <div className="space-y-4 p-5">
            <div>
              <Label htmlFor="name">Nama produk</Label>
              <Input
                id="name"
                name="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Contoh: Seragam SD lengan pendek"
                required
                maxLength={80}
              />
              {firstError(state, "name") ? (
                <p className="mt-1.5 text-xs font-medium text-rust-600">
                  {firstError(state, "name")}
                </p>
              ) : null}
            </div>

            <div>
              <Label htmlFor="category">Kategori</Label>
              <Input
                id="category"
                name="category"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                placeholder="Contoh: Seragam Sekolah"
                list="category-options"
                maxLength={40}
              />
              <datalist id="category-options">
                {categories.map((item) => (
                  <option key={item} value={item} />
                ))}
              </datalist>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {suggestedCategories.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setCategory(item)}
                    className={clsx(
                      "rounded-full px-2.5 py-1 text-[10px] font-semibold transition",
                      category === item
                        ? "bg-brand-100 text-brand-800"
                        : "bg-cream text-muted hover:bg-brand-50 hover:text-brand-700",
                    )}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Catatan (opsional)</Label>
              <Textarea
                id="notes"
                name="notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Contoh: bahan katun, warna putih biru"
                maxLength={500}
              />
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Ukuran & harga"
            description="Setiap ukuran bisa punya harga beli dan harga jual sendiri."
            action={
              <span className="text-[11px] font-semibold text-muted">
                {filled.length} ukuran
              </span>
            }
          />
          <div className="p-4 sm:p-5">
            <div className="mb-2 hidden gap-2 px-1 sm:grid sm:grid-cols-[1.1fr_1fr_1fr_36px]">
              <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted">
                Ukuran
              </span>
              <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted">
                Harga beli
              </span>
              <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted">
                Harga jual
              </span>
            </div>

            <div className="space-y-2.5">
              {sizes.map((row, index) => {
                const cost = Number(row.cost || 0);
                const selling = Number(row.selling || 0);
                const profit = selling - cost;
                const margin =
                  selling > 0 ? (profit / selling) * 100 : 0;

                return (
                  <div
                    key={row.key}
                    className="rounded-xl border border-line/70 bg-cream/35 p-3 sm:border-0 sm:bg-transparent sm:p-0"
                  >
                    <div className="grid gap-2 sm:grid-cols-[1.1fr_1fr_1fr_36px] sm:items-center">
                      <div>
                        <Label className="sm:hidden">Ukuran {index + 1}</Label>
                        <Input
                          value={row.label}
                          onChange={(event) =>
                            updateSize(row.key, "label", event.target.value)
                          }
                          placeholder="S / 30 / All size"
                          maxLength={20}
                          aria-label={`Nama ukuran ${index + 1}`}
                        />
                      </div>
                      <div>
                        <Label className="sm:hidden">Harga beli</Label>
                        <MoneyInput
                          value={displayDigits(row.cost)}
                          onChange={(event) =>
                            updateSize(row.key, "cost", event.target.value)
                          }
                          placeholder="0"
                          aria-label={`Harga beli ukuran ${index + 1}`}
                        />
                      </div>
                      <div>
                        <Label className="sm:hidden">Harga jual</Label>
                        <MoneyInput
                          value={displayDigits(row.selling)}
                          onChange={(event) =>
                            updateSize(row.key, "selling", event.target.value)
                          }
                          placeholder="0"
                          aria-label={`Harga jual ukuran ${index + 1}`}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeSize(row.key)}
                        className="hidden h-9 w-9 place-items-center rounded-lg text-muted transition hover:bg-rust-50 hover:text-rust-600 sm:grid"
                        aria-label="Hapus ukuran"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="mt-1.5 flex items-center justify-between gap-2 sm:pl-1">
                      <button
                        type="button"
                        onClick={() => removeSize(row.key)}
                        className="text-[10px] font-semibold text-rust-500 sm:hidden"
                      >
                        Hapus ukuran
                      </button>
                      {selling > 0 ? (
                        <p
                          className={clsx(
                            "ml-auto text-[10px] font-medium",
                            profit >= 0 ? "text-brand-600" : "text-rust-500",
                          )}
                        >
                          Laba {formatRupiah(profit)} ·{" "}
                          {formatPercent(margin, 1)}
                        </p>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>

            {firstError(state, "sizes") ? (
              <p className="mt-3 text-xs font-medium text-rust-600">
                {firstError(state, "sizes")}
              </p>
            ) : null}

            <div className="mt-4 flex flex-col gap-3 border-t border-line/70 pt-4">
              <button
                type="button"
                onClick={() => addSize()}
                className={buttonClasses({
                  variant: "secondary",
                  size: "sm",
                  className: "self-start",
                })}
              >
                <Plus className="h-3.5 w-3.5" />
                Tambah ukuran
              </button>

              <div className="flex flex-wrap items-center gap-1.5">
                <span className="mr-1 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.06em] text-muted">
                  <Wand2 className="h-3 w-3" />
                  Tambah cepat
                </span>
                {quickSizeOptions.map((label) => {
                  const exists = sizes.some(
                    (row) =>
                      row.label.trim().toLowerCase() === label.toLowerCase(),
                  );
                  return (
                    <button
                      key={label}
                      type="button"
                      disabled={exists}
                      onClick={() => addSize(label)}
                      className="rounded-full border border-line bg-paper px-2.5 py-1 text-[10px] font-semibold text-muted transition hover:border-brand-200 hover:text-brand-700 disabled:opacity-35"
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="space-y-4 xl:sticky xl:top-6">
        <Card className="overflow-hidden">
          <div className="bg-brand-800 p-5 text-cream">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gold-300">
              Ringkasan produk
            </p>
            <h3 className="mt-1.5 truncate font-display text-xl font-semibold">
              {name.trim() || "Nama produk"}
            </h3>
            <p className="mt-1 text-xs text-brand-100/75">
              {category.trim() || "Tanpa kategori"} · {filled.length} ukuran
            </p>

            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-paper/15 pt-4">
              <div>
                <p className="text-[10px] text-brand-100/70">Harga jual</p>
                <p className="mt-0.5 text-sm font-bold tabular-nums">
                  {prices.length === 0
                    ? "—"
                    : minPrice === maxPrice
                      ? formatRupiah(minPrice)
                      : `${formatRupiah(minPrice)} – ${formatRupiah(maxPrice)}`}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-brand-100/70">Rata-rata margin</p>
                <p className="mt-0.5 text-sm font-bold tabular-nums text-gold-200">
                  {totalSelling > 0 ? formatPercent(margin, 1) : "—"}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3 p-4">
            <div className="flex gap-2 rounded-xl bg-cream/60 p-3 text-[11px] leading-relaxed text-muted">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-600" />
              Harga beli dipakai untuk menghitung laba. Riwayat transaksi
              menyimpan harga saat itu, jadi perubahan harga tidak mengubah
              laporan lama.
            </div>

            <button
              type="submit"
              disabled={pending}
              className={buttonClasses({ className: "w-full" })}
            >
              {pending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Menyimpan…
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  {mode === "edit" ? "Simpan perubahan" : "Simpan produk"}
                </>
              )}
            </button>
            <Link
              href="/produk"
              className={buttonClasses({
                variant: "ghost",
                className: "w-full",
              })}
            >
              <ArrowLeft className="h-4 w-4" />
              Kembali ke daftar produk
            </Link>
          </div>
        </Card>

        <Card>
          <CardHeader title="Tips harga" />
          <div className="p-4 text-xs leading-relaxed text-muted">
            <p className="flex items-start gap-2">
              <Tag className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold-600" />
              Untuk seragam sekolah, isi setiap ukuran dengan harga beli yang
              berbeda jika modalnya memang berbeda. Harga jual bisa Anda atur
              bebas per ukuran.
            </p>
          </div>
        </Card>
      </div>
    </form>
  );
}
