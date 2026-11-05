import type { ButtonHTMLAttributes } from "react";
import clsx, { type ClassValue } from "clsx";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "danger"
  | "gold";
export type ButtonSize = "sm" | "md" | "lg" | "icon";

const base =
  "inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-xl font-semibold transition-all duration-200 active:scale-[0.985] disabled:pointer-events-none disabled:opacity-55";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-brand-700 text-paper shadow-[0_10px_24px_-16px_rgba(18,55,39,0.9)] hover:bg-brand-800",
  secondary:
    "border border-line bg-paper text-ink hover:border-brand-300 hover:bg-brand-50",
  ghost: "text-muted hover:bg-brand-50 hover:text-brand-800",
  danger: "bg-rust-500 text-white hover:bg-rust-600",
  gold: "border border-gold-300 bg-gold-100 text-gold-700 hover:bg-gold-200",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-xs",
  md: "h-11 px-4 text-sm",
  lg: "h-12 px-6 text-sm",
  icon: "h-10 w-10",
};

export function buttonClasses({
  variant = "primary",
  size = "md",
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: ClassValue;
} = {}) {
  return clsx(base, variants[variant], sizes[size], className);
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClasses({ variant, size, className })}
      {...props}
    />
  );
}
