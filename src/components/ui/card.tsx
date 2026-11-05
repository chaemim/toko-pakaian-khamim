import type { HTMLAttributes, ReactNode } from "react";
import clsx, { type ClassValue } from "clsx";

export function Card({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        "rounded-2xl border border-line bg-paper shadow-card",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({
  title,
  description,
  action,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: ClassValue;
}) {
  return (
    <div
      className={clsx(
        "flex flex-wrap items-start justify-between gap-3 border-b border-line/80 px-5 py-4",
        className,
      )}
    >
      <div>
        <h2 className="text-sm font-bold text-ink">{title}</h2>
        {description ? (
          <p className="mt-0.5 text-xs text-muted">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}
