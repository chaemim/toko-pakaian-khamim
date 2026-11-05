import type { ReactNode } from "react";
import clsx, { type ClassValue } from "clsx";

export type BadgeTone =
  | "brand"
  | "gold"
  | "muted"
  | "danger"
  | "outline"
  | "ink";

const tones: Record<BadgeTone, string> = {
  brand: "bg-brand-50 text-brand-700 ring-brand-100",
  gold: "bg-gold-50 text-gold-700 ring-gold-200",
  muted: "bg-cream text-muted ring-line",
  danger: "bg-rust-50 text-rust-600 ring-rust-100",
  outline: "bg-transparent text-muted ring-line",
  ink: "bg-ink text-paper ring-ink",
};

export function Badge({
  children,
  tone = "brand",
  className,
}: {
  children: ReactNode;
  tone?: BadgeTone;
  className?: ClassValue;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
