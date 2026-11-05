import Link from "next/link";
import { ReceiptText, Shirt } from "lucide-react";
import clsx from "clsx";

const tabs = [
  {
    key: "barang",
    href: "/penjualan",
    label: "Barang terjual",
    icon: Shirt,
  },
  {
    key: "transaksi",
    href: "/penjualan/transaksi",
    label: "Riwayat transaksi",
    icon: ReceiptText,
  },
] as const;

export function SalesNav({ active }: { active: "barang" | "transaksi" }) {
  return (
    <nav
      className="grid w-full grid-cols-2 gap-1 rounded-xl border border-line bg-paper p-1 shadow-card sm:w-fit"
      aria-label="Menu penjualan"
    >
      {tabs.map(({ key, href, label, icon: Icon }) => {
        const isActive = active === key;
        return (
          <Link
            key={key}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className={clsx(
              "flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-bold transition",
              isActive
                ? "bg-brand-700 text-paper shadow-sm"
                : "text-muted hover:bg-cream hover:text-ink",
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
