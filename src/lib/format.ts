const rupiahFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("id-ID");

export function formatRupiah(value: number | string | null | undefined): string {
  const number = typeof value === "string" ? Number(value) : (value ?? 0);
  return rupiahFormatter.format(Number.isFinite(number) ? number : 0);
}

/** Contoh: Rp 1,2 jt */
export function formatRupiahShort(value: number): string {
  if (Math.abs(value) >= 1_000_000_000) {
    return `Rp ${trimDecimal(value / 1_000_000_000)} M`;
  }
  if (Math.abs(value) >= 1_000_000) {
    return `Rp ${trimDecimal(value / 1_000_000)} jt`;
  }
  if (Math.abs(value) >= 1_000) {
    return `Rp ${trimDecimal(value / 1_000)} rb`;
  }
  return `Rp ${numberFormatter.format(value)}`;
}

function trimDecimal(value: number) {
  return value.toFixed(1).replace(".0", "").replace(".", ",");
}

export function formatNumber(value: number | string | null | undefined): string {
  const number = typeof value === "string" ? Number(value) : (value ?? 0);
  return numberFormatter.format(Number.isFinite(number) ? number : 0);
}

export function formatPercent(value: number, digits = 0): string {
  return `${value.toFixed(digits).replace(".", ",")}%`;
}

export function parseRupiahInput(value: string | null | undefined): number {
  if (!value) return 0;
  const digits = value.replace(/[^\d]/g, "");
  return digits ? Number(digits) : 0;
}

export function marginPercent(cost: number, price: number): number {
  if (price <= 0) return 0;
  return ((price - cost) / price) * 100;
}

export function paymentLabel(method: string): string {
  switch (method) {
    case "cash":
      return "Tunai";
    case "transfer":
      return "Transfer";
    case "qris":
      return "QRIS";
    default:
      return "Lainnya";
  }
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}
