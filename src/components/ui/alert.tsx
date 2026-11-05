import type { ReactNode } from "react";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import clsx from "clsx";

const tones = {
  error: {
    wrapper: "border-rust-100 bg-rust-50 text-rust-700",
    icon: AlertCircle,
  },
  success: {
    wrapper: "border-brand-100 bg-brand-50 text-brand-800",
    icon: CheckCircle2,
  },
  info: {
    wrapper: "border-gold-200 bg-gold-50 text-gold-700",
    icon: Info,
  },
};

export function Alert({
  tone = "info",
  children,
  className,
}: {
  tone?: keyof typeof tones;
  children: ReactNode;
  className?: string;
}) {
  const { wrapper, icon: Icon } = tones[tone];
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={clsx(
        "flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-sm font-medium",
        wrapper,
        className,
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="leading-relaxed">{children}</div>
    </div>
  );
}
