import type {
  InputHTMLAttributes,
  LabelHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import clsx, { type ClassValue } from "clsx";

export const inputClasses =
  "w-full rounded-xl border border-line bg-paper px-3.5 py-2.5 text-sm text-ink placeholder:text-muted/55 shadow-[inset_0_1px_2px_rgba(27,35,30,0.03)] transition focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-500/10 disabled:cursor-not-allowed disabled:bg-cream/70 disabled:text-muted";

export const labelClasses =
  "mb-1.5 block text-[11px] font-bold uppercase tracking-[0.09em] text-muted";

export function Label({
  className,
  ...props
}: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={clsx(labelClasses, className)} {...props} />;
}

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={clsx(inputClasses, className)} {...props} />;
}

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={clsx(inputClasses, "min-h-20 resize-y", className)}
      {...props}
    />
  );
}

export function Select({
  className,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={clsx(inputClasses, "appearance-none pr-9", className)}
      {...props}
    />
  );
}

export function FieldError({ children }: { children?: string }) {
  if (!children) return null;
  return <p className="mt-1.5 text-xs font-medium text-rust-600">{children}</p>;
}

export function FieldHint({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return <p className="mt-1.5 text-xs text-muted">{children}</p>;
}

export function MoneyInput({
  className,
  prefixClassName,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { prefixClassName?: ClassValue }) {
  return (
    <div className="relative">
      <span
        className={clsx(
          "pointer-events-none absolute inset-y-0 left-3 flex items-center text-xs font-semibold text-muted",
          prefixClassName,
        )}
      >
        Rp
      </span>
      <input
        inputMode="numeric"
        autoComplete="off"
        className={clsx(inputClasses, "pl-9", className)}
        {...props}
      />
    </div>
  );
}
