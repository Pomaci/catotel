"use client";

import { ReactNode } from "react";
import clsx from "clsx";

const colorMap: Record<
  string,
  { bg: string; text: string; border: string; dot: string }
> = {
  default: {
    bg: "bg-sand-100",
    text: "text-cocoa-700",
    border: "border-sand-200",
    dot: "bg-cocoa-600",
  },
  success: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-100",
    dot: "bg-emerald-400",
  },
  warning: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-100",
    dot: "bg-amber-400",
  },
  danger: {
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-100",
    dot: "bg-rose-400",
  },
  info: {
    bg: "bg-lagoon-100",
    text: "text-lagoon-600",
    border: "border-lagoon-200",
    dot: "bg-lagoon-500",
  },
};

export function Badge({
  children,
  tone = "default",
  dot = false,
  className,
}: {
  children: ReactNode;
  tone?: keyof typeof colorMap;
  dot?: boolean;
  className?: string;
}) {
  const colors = colorMap[tone] ?? colorMap.default;
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium",
        colors.bg,
        colors.text,
        colors.border,
        className,
      )}
    >
      {dot && (
        <span
          className={clsx("h-1.5 w-1.5 rounded-full", colors.dot)}
          aria-hidden
        />
      )}
      {children}
    </span>
  );
}
