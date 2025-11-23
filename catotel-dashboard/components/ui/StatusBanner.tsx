"use client";

import clsx from "clsx";
import { ReactNode } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";

type Props = {
  variant?: "error" | "success" | "info";
  children: ReactNode;
};

const iconMap = {
  error: AlertCircle,
  success: CheckCircle2,
  info: AlertCircle,
};

export function StatusBanner({ variant = "info", children }: Props) {
  const Icon = iconMap[variant];
  return (
    <div
      className={clsx(
        "flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm",
        variant === "error" &&
          "border-red-200 bg-red-50 text-red-600",
        variant === "success" &&
          "border-emerald-200 bg-emerald-50 text-emerald-700",
        variant === "info" && "border-sand-200 bg-white/80 text-cocoa-700",
      )}
    >
      <Icon className="h-4 w-4" aria-hidden />
      <span>{children}</span>
    </div>
  );
}

