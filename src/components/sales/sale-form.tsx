"use client";

import {
  useActionState,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  Banknote,
  Check,
  ChevronDown,
  ChevronRight,
  Minus,
  Plus,
  QrCode,
  ReceiptText,
  Search,
  ShoppingBag,
  Trash2,
  Wallet,
  X,
} from "lucide-react";
import clsx from "clsx";

import { createSaleAction } from "@/actions/sales";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import {
  Input,
  Label,
  MoneyInput,
  Textarea,
} from "@/components/ui/field";
import { EmptyState } from "@/components/ui/empty-state";
import { formatNumber, formatPercent, formatRupiah } from "@/lib/format";
import { EMPTY_ACTION_STATE } from "@/lib/types";

export type SaleProduct = {
  id: string;
  name: string;
  category: string | null;
  sizes: {
    id: string;
    label: string;
    costPrice: number;
    sellingPrice: number;
  }[];
};

type CartLine = {
  sizeId: string;
  productId: string;
  productName: string;
  sizeLabel: string;
  costPrice: number;
  listPrice: number;
  unitPrice: number;
  qty: number;
};

const paymentOptions = [
  { value: "cash", label: "Tunai", icon: Banknote },
  { value: "transfer", label: "Transfer", icon: Wallet },
  { value: "qris", label: "QRIS", icon: QrCode },
];

const PRODUCTS_PER_PAGE = 6;

function onlyDigits(value: string) {
  return value.replace(/\D/g, "").slice(0, 12);
}

function displayDigits(value: number) {
  return value ? formatNumber(value) : "";
}

function StepHeader({
  step,
  title,
  description,
  tone = "neutral",
  action,
  divider = true,
}: {
  step: string;
  title: string;
  description?: string;
  tone?: "neutral" | "cart" | "gold";
  action?: ReactNode;
  divider?: boolean;
}) {
  const stepTones = {
    neutral: "bg-cream text-brand-800",
    cart: "bg-paper/15 text-paper",
    gold: "bg-gold-100 text-gold-700",
  };

  return (
    <div
      className={clsx(
        "flex items-start gap-3 px-4 py-3.5",
        divider &&
          (tone === "cart"
            ? "border-b border-brand-600/50"
            : "border-b border-line/80"),
      )}
    >
      <span
        className={clsx(
          "grid h-7 w-7 shrink-0 place-items-center rounded-full text-[11px] font-bold tabular-nums",
          stepTones[tone],
        )}
      >
        {step}
      </span>
      <div className="min-w-0 flex-1">
        <h2
          className={clsx(
            "text-sm font-bold",
            tone === "cart" ? "text-paper" : "text-ink",
          )}
        >
          {title}
        </h2>
        {description ? (
          <p
            className={clsx(
              "mt-0.5 text-[11px] leading-snug",
              tone === "cart" ? "text-brand-100" : "text-muted",
            )}
          >
            {description}
          </p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export function SaleForm({
  products,
  today,
}: {
  products: SaleProduct[];
  today: string;
}) {
  const [state, formAction, pending] = useActionState(
    createSaleAction,
    EMPTY_ACTION_STATE,
  );

  const [items, setItems] = useState<CartLine[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Semua");
  const [soldOn, setSoldOn] = useState(today);
  const [customerName, setCustomerName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [discountText, setDiscountText] = useState("");
  const [note, setNote] = useState("");
  const [visibleCount, setVisibleCount] = useState(PRODUCTS_PER_PAGE);

  const categories = useMemo(
    () => [
      "Semua",
      ...new Set(
        products
          .map((product) => product.category)
          .filter((value): value is string => Boolean(value)),
      ),
    ],
    [products],
  );

  const filteredProducts = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return products.filter((product) => {
      if (
        category !== "Semua" &&
        (product.category ?? "Tanpa kategori") !== category
      ) {
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

  useEffect(() => {
    setVisibleCount(PRODUCTS_PER_PAGE);
  }, [search, category]);

  const visibleProducts = filteredProducts.slice(0, visibleCount);
  const hasMoreProducts = filteredProducts.length > visibleCount;
  const remainingProducts = Math.max(
    filteredProducts.length - visibleCount,
    0,
  );

  const qtyBySize = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of items) {
      map.set(item.sizeId, (map.get(item.sizeId) ?? 0) + item.qty);
    }
    return map;
  }, [items]);

  const subtotal = items.reduce(
    (sum, item) => sum + item.unitPrice * item.qty,
    0,
  );
  const grossProfit = items.reduce(
    (sum, item) => sum + (item.unitPrice - item.costPrice) * item.qty,
    0,
  );
  const totalCost = items.reduce(
    (sum, item) => sum + item.costPrice * item.qty,
    0,
  );
  const discount = Number(discountText || 0);
  const total = Math.max(subtotal - discount, 0);
  const profit = grossProfit - discount;
  const totalQty = items.reduce((sum, item) => sum + item.qty, 0);
  const margin = total > 0 ? (profit / total) * 100 : 0;
  const paymentLabel =
    paymentOptions.find((option) => option.value === paymentMethod)?.label ??
    "Tunai";
  const paymentSummary = `${paymentLabel} · ${
    customerName.trim() || "pelanggan umum"
  }${discount > 0 ? ` · diskon ${formatRupiah(discount)}` : ""}`;

  function addItem(product: SaleProduct, size: SaleProduct["sizes"][number]) {
    setItems((current) => {
      const existing = current.find((item) => item.sizeId === size.id);
      if (existing) {
        return current.map((item) =>
          item.sizeId === size.id ? { ...item, qty: item.qty + 1 } : item,
        );
      }
      return [
        ...current,
        {
          sizeId: size.id,
          productId: product.id,
          productName: product.name,
          sizeLabel: size.label,
          costPrice: size.costPrice,
          listPrice: size.sellingPrice,
          unitPrice: size.sellingPrice,
          qty: 1,
        },
      ];
    });
  }

  function removeItem(sizeId: string) {
    setItems((current) => current.filter((item) => item.sizeId !== sizeId));
  }

  function changeQty(sizeId: string, delta: number) {
    setItems((current) =>
      current.map((item) =>
        item.sizeId === sizeId
          ? { ...item, qty: Math.max(1, Math.min(999, item.qty + delta)) }
          : item,
      ),
    );
  }

  function changePrice(sizeId: string, value: string) {
    const digits = Number(onlyDigits(value) || 0);
    setItems((current) =>
      current.map((item) =>
        item.sizeId === sizeId ? { ...item, unitPrice: digits } : item,
      ),
    );
  }

  const payloadItems = items.map((item) => ({
    sizeId: item.sizeId,
    qty: item.qty,
    unitPrice: item.unitPrice,
  }));

  if (products.length === 0) {
    return (
      <EmptyState
        icon={<ShoppingBag className="h-6 w-6" />}
        title="Belum ada produk untuk dijual"
        description="Tambahkan produk dan harganya terlebih dahulu. Setelah itu Anda bisa langsung mencatat penjualan."
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
    );
  }

  return (
    <form
      action={formAction}
      className="grid items-start gap-5 pb-20 lg:grid-cols-[1.35fr_1fr] lg:pb-0"
    >
      <input type="hidden" name="items" value={JSON.stringify(payloadItems)} />
      <input type="hidden" name="paymentMethod" value={paymentMethod} />
      <input type="hidden" name="soldOn" value={soldOn} />
      <input type="hidden" name="discount" value={discount} />
      <input type="hidden" name="customerName" value={customerName} />
      <input type="hidden" name="note" value={note} />

      <div className="space-y-4">
        <Card className="overflow-hidden">
          <StepHeader
            step="1"
            title="Pilih barang"
            description="Ketuk ukuran untuk menambah ke keranjang."
            action={
              totalQty > 0 ? <Badge tone="brand">{totalQty} pcs</Badge> : null
            }
          />
          <div className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cari nama barang atau ukuran…"
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
            <Link
              href="/produk"
              className="hidden shrink-0 text-[11px] font-semibold text-brand-700 hover:text-brand-800 sm:block"
            >
              Kelola produk
            </Link>
          </div>
          <div className="hide-scrollbar flex gap-1.5 overflow-x-auto border-t border-line/70 bg-cream/25 px-3 py-2.5">
            {categories.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setCategory(item)}
                className={clsx(
                  "shrink-0 rounded-full px-3 py-1.5 text-[11px] font-semibold transition",
                  category === item
                    ? "bg-brand-700 text-paper"
                    : "bg-cream text-muted hover:bg-brand-50 hover:text-brand-700",
                )}
              >
                {item}
              </button>
            ))}
          </div>
        </Card>

        {filteredProducts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line bg-paper/60 px-5 py-10 text-center">
            <p className="text-sm font-semibold text-ink">
              Produk tidak ditemukan
            </p>
            <p className="mt-1 text-xs text-muted">
              Coba kata kunci lain atau ganti kategori.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setCategory("Semua");
              }}
              className={buttonClasses({
                variant: "secondary",
                size: "sm",
                className: "mt-4",
              })}
            >
              Reset filter
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid gap-2.5 sm:grid-cols-2">
            {visibleProducts.map((product) => {
              const selectedQty = product.sizes.reduce(
                (sum, size) => sum + (qtyBySize.get(size.id) ?? 0),
                0,
              );
              return (
                <div
                  key={product.id}
                  className={clsx(
                    "rounded-xl border bg-paper p-3.5 shadow-card transition",
                    selectedQty > 0
                      ? "border-brand-300 ring-1 ring-brand-100"
                      : "border-line hover:border-brand-200",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="line-clamp-2 text-[13px] font-bold leading-tight text-ink">
                        {product.name}
                      </h3>
                      <p className="mt-0.5 text-[10px] text-muted">
                        {product.category || "Tanpa kategori"}
                      </p>
                    </div>
                    <span
                      className={clsx(
                        "shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold",
                        selectedQty > 0
                          ? "bg-brand-50 text-brand-700"
                          : "bg-cream text-muted",
                      )}
                    >
                      {selectedQty > 0
                        ? `${selectedQty} dipilih`
                        : `${product.sizes.length} ukuran`}
                    </span>
                  </div>
                  <div className="mt-2.5 grid grid-cols-2 gap-1.5">
                    {product.sizes.map((size) => {
                      const qty = qtyBySize.get(size.id) ?? 0;

                      if (qty > 0) {
                        return (
                          <div
                            key={size.id}
                            className="col-span-2 flex min-h-11 items-center justify-between gap-2 rounded-xl border border-brand-300 bg-brand-50 px-2.5 py-1.5"
                          >
                            <div className="min-w-0">
                              <span className="block truncate text-[11px] font-bold leading-none text-brand-900">
                                {size.label}
                              </span>
                              <span className="mt-1 block text-[9px] leading-none text-brand-600">
                                {formatRupiah(size.sellingPrice)}
                              </span>
                            </div>
                            <div className="flex shrink-0 items-center rounded-lg border border-brand-200 bg-paper">
                              <button
                                type="button"
                                onClick={() => changeQty(size.id, -1)}
                                disabled={qty <= 1}
                                className="grid h-8 w-8 place-items-center text-brand-700 transition hover:bg-brand-50 disabled:opacity-30"
                                aria-label={`Kurangi ${product.name} ${size.label}`}
                              >
                                <Minus className="h-3 w-3" />
                              </button>
                              <span className="min-w-4 text-center text-[11px] font-bold tabular-nums text-brand-900">
                                {qty}
                              </span>
                              <button
                                type="button"
                                onClick={() => changeQty(size.id, 1)}
                                className="grid h-8 w-8 place-items-center text-brand-700 transition hover:bg-brand-50"
                                aria-label={`Tambah ${product.name} ${size.label}`}
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <button
                          key={size.id}
                          type="button"
                          onClick={() => addItem(product, size)}
                          className="flex min-h-11 items-center justify-between gap-2 rounded-xl border border-line bg-cream/40 px-2.5 py-1.5 text-left transition hover:border-brand-300 hover:bg-brand-50 active:scale-[0.98]"
                        >
                          <span className="min-w-0">
                            <span className="block truncate text-[11px] font-bold leading-none text-ink">
                              {size.label}
                            </span>
                            <span className="mt-1 block text-[9px] leading-none text-muted">
                              {formatRupiah(size.sellingPrice)}
                            </span>
                          </span>
                          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-700 text-paper">
                            <Plus className="h-3 w-3" />
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            </div>
            {filteredProducts.length > PRODUCTS_PER_PAGE ? (
              <div className="flex flex-col items-center gap-2">
                <p className="text-[10px] text-muted">
                  Menampilkan {visibleProducts.length} dari{" "}
                  {filteredProducts.length} produk
                </p>
                {hasMoreProducts ? (
                  <button
                    type="button"
                    onClick={() =>
                      setVisibleCount((count) => count + PRODUCTS_PER_PAGE)
                    }
                    className={buttonClasses({
                      variant: "secondary",
                      size: "sm",
                      className: "w-full sm:w-auto",
                    })}
                  >
                    <ChevronDown className="h-4 w-4" />
                    Muat {Math.min(PRODUCTS_PER_PAGE, remainingProducts)} produk
                    lagi
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setVisibleCount(PRODUCTS_PER_PAGE)}
                    className={buttonClasses({
                      variant: "secondary",
                      size: "sm",
                      className: "w-full sm:w-auto",
                    })}
                  >
                    <ChevronDown className="h-4 w-4 rotate-180" />
                    Ringkas daftar
                  </button>
                )}
              </div>
            ) : null}
          </div>
        )}
      </div>

      <div className="space-y-4 lg:sticky lg:top-6">
        {state.error ? <Alert tone="error">{state.error}</Alert> : null}

        <div
          id="keranjang"
          className="scroll-mt-24 overflow-hidden rounded-2xl border border-brand-200 bg-brand-50/40 shadow-card"
        >
          <div className="bg-brand-700">
            <StepHeader
              step="2"
              title="Keranjang"
              description={
                items.length > 0
                  ? `${totalQty} pcs · ${items.length} jenis`
                  : "Belum ada barang dipilih."
              }
              tone="cart"
              action={
                items.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => setItems([])}
                    className="shrink-0 rounded-full border border-paper/20 px-2.5 py-1 text-[10px] font-semibold text-brand-50 transition hover:bg-paper/10"
                  >
                    Kosongkan
                  </button>
                ) : null
              }
            />
          </div>

          <div className="p-3 sm:p-4">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-brand-200 bg-paper/70 px-4 py-7 text-center">
                <span className="mb-2.5 grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-600">
                  <ShoppingBag className="h-5 w-5" />
                </span>
                <p className="text-sm font-semibold text-ink">
                  Keranjang masih kosong
                </p>
                <p className="mt-1 max-w-[240px] text-xs leading-relaxed text-muted">
                  Ketuk ukuran di langkah 1. Barang yang dipilih akan muncul di
                  sini.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {items.map((item) => {
                  const lineProfit =
                    (item.unitPrice - item.costPrice) * item.qty;
                  const negotiated = item.unitPrice !== item.listPrice;
                  return (
                    <div
                      key={item.sizeId}
                      className="rounded-xl border border-brand-100 bg-paper p-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-xs font-bold text-ink">
                            {item.productName}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-1">
                            <Badge tone="brand">{item.sizeLabel}</Badge>
                            {negotiated ? (
                              <Badge tone="gold">Nego</Badge>
                            ) : null}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(item.sizeId)}
                          className="-mr-1 -mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-lg text-muted transition hover:bg-rust-50 hover:text-rust-600"
                          aria-label={`Hapus ${item.productName}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex h-10 shrink-0 items-center rounded-lg border border-brand-100 bg-brand-50/40">
                          <button
                            type="button"
                            onClick={() => changeQty(item.sizeId, -1)}
                            disabled={item.qty <= 1}
                            className="grid h-10 w-8 place-items-center text-muted transition hover:text-ink disabled:opacity-30"
                            aria-label="Kurangi jumlah"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="min-w-6 text-center text-xs font-bold tabular-nums">
                            {item.qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => changeQty(item.sizeId, 1)}
                            className="grid h-10 w-8 place-items-center text-muted transition hover:text-ink"
                            aria-label="Tambah jumlah"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        <div className="relative min-w-0 flex-1">
                          <span className="pointer-events-none absolute inset-y-0 left-2.5 flex items-center text-[10px] font-semibold text-muted">
                            Rp
                          </span>
                          <input
                            inputMode="numeric"
                            value={displayDigits(item.unitPrice)}
                            onChange={(event) =>
                              changePrice(item.sizeId, event.target.value)
                            }
                            className="h-10 w-full rounded-lg border border-brand-100 bg-brand-50/30 pl-7 pr-2 text-right text-xs font-bold tabular-nums text-ink transition focus:border-brand-400 focus:bg-paper focus:outline-none focus:ring-4 focus:ring-brand-500/10"
                            aria-label={`Harga jual ${item.productName} ${item.sizeLabel}`}
                            title="Harga satuan"
                          />
                        </div>

                        <p className="w-[74px] shrink-0 text-right text-xs font-bold tabular-nums text-ink">
                          {formatRupiah(item.unitPrice * item.qty)}
                        </p>
                      </div>

                      <div className="mt-1.5 flex flex-wrap items-center justify-between gap-1 text-[10px]">
                        {negotiated ? (
                          <span className="text-muted">
                            Harga daftar{" "}
                            <span className="line-through">
                              {formatRupiah(item.listPrice)}
                            </span>
                          </span>
                        ) : (
                          <span className="text-muted">Harga sesuai daftar</span>
                        )}
                        <span
                          className={clsx(
                            "font-semibold",
                            lineProfit >= 0
                              ? "text-brand-600"
                              : "text-rust-500",
                          )}
                        >
                          Laba {formatRupiah(lineProfit)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <Card className="overflow-hidden border-gold-200/80">
          <StepHeader
            step="3"
            title="Pembayaran"
            description={
              paymentOpen
                ? "Atur tanggal, pelanggan, dan diskon."
                : paymentSummary
            }
            tone="gold"
            divider={paymentOpen}
            action={
              <button
                type="button"
                onClick={() => setPaymentOpen((open) => !open)}
                aria-expanded={paymentOpen}
                aria-controls="payment-fields"
                className="inline-flex h-9 shrink-0 items-center gap-1 rounded-full border border-gold-200 bg-paper/70 px-3 text-[11px] font-semibold text-gold-700 transition hover:bg-gold-50"
              >
                {paymentOpen ? "Tutup" : "Atur"}
                <ChevronDown
                  className={clsx(
                    "h-3.5 w-3.5 transition-transform",
                    paymentOpen && "rotate-180",
                  )}
                />
              </button>
            }
          />
          {paymentOpen ? (
            <div id="payment-fields" className="space-y-4 bg-gold-50/25 p-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="soldOn">Tanggal</Label>
                <Input
                  id="soldOn"
                  type="date"
                  value={soldOn}
                  max={today}
                  onChange={(event) => setSoldOn(event.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="customerName">Pelanggan</Label>
                <Input
                  id="customerName"
                  value={customerName}
                  onChange={(event) => setCustomerName(event.target.value)}
                  placeholder="Opsional"
                  maxLength={80}
                />
              </div>
            </div>

            <div>
              <Label>Pembayaran</Label>
              <div className="grid grid-cols-3 gap-1.5">
                {paymentOptions.map((option) => {
                  const Icon = option.icon;
                  const active = paymentMethod === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setPaymentMethod(option.value)}
                      aria-pressed={active}
                      className={clsx(
                        "flex h-11 items-center justify-center gap-1.5 rounded-xl border text-[11px] font-semibold transition",
                        active
                          ? "border-brand-600 bg-brand-50 text-brand-800 shadow-sm"
                          : "border-line bg-paper text-muted hover:border-brand-200",
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <Label htmlFor="discount">Diskon (opsional)</Label>
              <MoneyInput
                id="discount"
                value={displayDigits(discount)}
                onChange={(event) =>
                  setDiscountText(onlyDigits(event.target.value))
                }
                placeholder="0"
              />
              {discount > 0 ? (
                <p className="mt-1 text-[10px] text-muted">
                  Diskon mengurangi total dan laba transaksi.
                </p>
              ) : null}
            </div>

            <div>
              <Label htmlFor="note">Catatan (opsional)</Label>
              <Textarea
                id="note"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Contoh: pembeli langganan, minta packing"
                maxLength={300}
                className="min-h-16"
              />
            </div>
            </div>
          ) : null}
        </Card>

        <Card className="overflow-hidden border-brand-200">
          <CardHeader
            title="Ringkasan"
            description="Total dan laba transaksi"
            className="bg-brand-50/60"
            action={
              items.length > 0 ? (
                <Badge tone="brand">{totalQty} pcs</Badge>
              ) : null
            }
          />
          <div className="space-y-2.5 p-4">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted">Subtotal</span>
              <span className="font-semibold tabular-nums text-ink">
                {formatRupiah(subtotal)}
              </span>
            </div>
            {discount > 0 ? (
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted">Diskon</span>
                <span className="font-semibold tabular-nums text-rust-500">
                  − {formatRupiah(discount)}
                </span>
              </div>
            ) : null}
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted">Modal barang</span>
              <span className="font-medium tabular-nums text-muted">
                {formatRupiah(totalCost)}
              </span>
            </div>
            <div className="flex items-baseline justify-between rounded-xl border border-brand-100 bg-brand-50/60 px-3.5 py-3">
              <span className="text-xs font-bold text-ink">Total</span>
              <span className="font-display text-2xl font-semibold tabular-nums text-ink">
                {formatRupiah(total)}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-brand-700 px-3.5 py-2.5 text-paper">
              <span className="text-[11px] font-semibold text-brand-100">
                Estimasi laba
              </span>
              <span
                className={clsx(
                  "text-xs font-bold tabular-nums",
                  profit >= 0 ? "text-paper" : "text-rust-100",
                )}
              >
                {formatRupiah(profit)}
                {total > 0 ? (
                  <span className="ml-1 font-medium text-brand-200">
                    ({formatPercent(margin, 1)})
                  </span>
                ) : null}
              </span>
            </div>
            {profit < 0 && items.length > 0 ? (
              <p className="flex items-center gap-1 text-[10px] font-medium text-rust-500">
                <AlertCircle className="h-3 w-3" />
                Harga jual di bawah modal. Periksa kembali.
              </p>
            ) : null}
            <p className="text-center text-[10px] leading-relaxed text-muted lg:hidden">
              Harga deal boleh berbeda dari daftar. Laba dihitung otomatis dari
              harga beli.
            </p>
          </div>

          <div className="hidden border-t border-line bg-cream/40 p-4 lg:block">
            <button
              type="submit"
              disabled={items.length === 0 || pending}
              className={buttonClasses({
                size: "lg",
                className: "w-full",
              })}
            >
              {pending ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-paper/40 border-t-paper" />
                  Menyimpan penjualan…
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Simpan penjualan · {formatRupiah(total)}
                </>
              )}
            </button>
            <p className="mt-2 text-center text-[10px] text-muted">
              Harga deal boleh berbeda dari daftar. Laba dihitung otomatis dari
              harga beli.
            </p>
          </div>
        </Card>

        <Link
          href="/penjualan/transaksi"
          className={buttonClasses({
            variant: "ghost",
            className: "w-full",
          })}
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke riwayat transaksi
        </Link>
      </div>

      {items.length > 0 ? (
        <div className="fixed inset-x-0 bottom-16 z-30 border-t border-brand-700 bg-brand-800/95 px-3 py-2.5 shadow-[0_-10px_30px_-20px_rgba(18,55,39,0.7)] backdrop-blur-md lg:hidden">
          <div className="mx-auto flex max-w-lg items-center gap-2">
            <a
              href="#keranjang"
              className="group flex min-w-0 flex-1 items-center gap-2 rounded-xl px-1 py-1 transition active:bg-paper/10"
              aria-label="Lihat keranjang"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-paper/10 text-brand-50">
                <ShoppingBag className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1 text-[10px] font-semibold text-brand-100">
                  Keranjang · {totalQty} pcs
                  <ChevronRight className="h-3 w-3 transition group-hover:translate-x-0.5" />
                </span>
                <span className="block truncate text-base font-bold tabular-nums text-paper">
                  {formatRupiah(total)}
                </span>
                <span
                  className={clsx(
                    "block text-[9px]",
                    profit >= 0 ? "text-brand-200" : "text-rust-100",
                  )}
                >
                  Laba {formatRupiah(profit)}
                </span>
              </span>
            </a>
            <button
              type="submit"
              disabled={pending}
              className={buttonClasses({
                variant: "gold",
                size: "md",
                className: "shrink-0",
              })}
            >
              {pending ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-gold-700/30 border-t-gold-700" />
              ) : (
                <ReceiptText className="h-4 w-4" />
              )}
              Simpan
            </button>
          </div>
        </div>
      ) : null}
    </form>
  );
}
