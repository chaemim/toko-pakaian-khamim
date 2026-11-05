import type { ReactNode } from "react";
import clsx from "clsx";

export function StatCard({
  title,
  value,
  icon,
  footer,
  tone = "brand",
}: {
  title: string;
  value: ReactNode;
  icon: ReactNode;
  footer?: ReactNode;
  tone?: "brand" | "gold" | "ink" | "rust";
}) {
  const tones = {
    brand: "bg-brand-50 text-brand-700",
    gold: "bg-gold-50 text-gold-600",
    ink: "bg-cream text-ink",
    rust: "bg-rust-50 text-rust-500",
  };

  return (
    <div className="rounded-2xl border border-line bg-paper p-4 shadow-card sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <p className="pt-1 text-[11px] font-bold uppercase tracking-[0.08em] text-muted">
          {title}
        </p>
        <span
          className={clsx(
            "grid h-9 w-9 shrink-0 place-items-center rounded-xl",
            tones[tone],
          )}
        >
          {icon}
        </span>
      </div>
      <p className="mt-2.5 font-display text-[1.4rem] font-semibold leading-tight tracking-[-0.01em] tabular-nums text-ink sm:text-2xl">
        {value}
      </p>
      {footer ? <div className="mt-2 flex items-center gap-2">{footer}</div> : null}
    </div>
  );
}
