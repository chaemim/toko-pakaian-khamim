import clsx, { type ClassValue } from "clsx";

export function LogoMark({ className }: { className?: ClassValue }) {
  return (
    <span
      className={clsx(
        "grid shrink-0 place-items-center rounded-xl bg-brand-700 text-paper shadow-[0_8px_20px_-12px_rgba(18,55,39,0.9)]",
        className,
      )}
      aria-hidden="true"
    >
      <svg viewBox="0 0 24 24" fill="none" className="h-[68%] w-[68%]">
        <path
          d="M12 6.9a2 2 0 1 1 2 2c-.7 0-1 .3-1 .9v.8"
          stroke="#C59A4A"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M12 10.6 5.9 14.9c-.9.6-.4 2 .6 2h11c1.1 0 1.5-1.4.6-2L12 10.6Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path
          d="M12 10.6v6.3"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

export function Logo({
  storeName,
  subtitle = "Catatan penjualan",
  compact = false,
  className,
}: {
  storeName: string;
  subtitle?: string;
  compact?: boolean;
  className?: string;
}) {
  return (
    <div className={clsx("flex min-w-0 items-center gap-2.5", className)}>
      <LogoMark className={compact ? "h-9 w-9" : "h-10 w-10"} />
      <div className="min-w-0">
        <p
          className={clsx(
            "truncate font-display font-semibold leading-tight tracking-[-0.01em] text-ink",
            compact ? "text-base" : "text-lg",
          )}
        >
          {storeName}
        </p>
        {subtitle ? (
          <p className="truncate text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
            {subtitle}
          </p>
        ) : null}
      </div>
    </div>
  );
}
