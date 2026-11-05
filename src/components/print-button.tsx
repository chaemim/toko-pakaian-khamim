"use client";

import { Printer } from "lucide-react";
import { buttonClasses } from "@/components/ui/button";
import type { ButtonSize, ButtonVariant } from "@/components/ui/button";

export function PrintButton({
  label = "Cetak",
  variant = "secondary",
  size = "md",
  className,
}: {
  label?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className={buttonClasses({ variant, size, className })}
    >
      <Printer className="h-4 w-4" />
      {label}
    </button>
  );
}
