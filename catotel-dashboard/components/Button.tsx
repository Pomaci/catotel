"use client";

import { ButtonHTMLAttributes } from "react";
import clsx from "clsx";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
};

export function Button({ variant = "primary", className, ...props }: Props) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2";
  const variants: Record<Variant, string> = {
    primary:
      "bg-lagoon-500 text-white shadow-glow hover:bg-lagoon-600 focus-visible:outline-lagoon-500",
    secondary:
      "bg-white text-cocoa-700 border border-lagoon-100 hover:bg-lagoon-100/60 focus-visible:outline-lagoon-400",
    ghost:
      "border border-clay-200 text-cocoa-600 hover:border-lagoon-400 hover:text-lagoon-600 bg-transparent focus-visible:outline-lagoon-400",
    danger:
      "bg-red-500 text-white shadow focus-visible:outline-red-500 hover:bg-red-600",
    outline:
      "border border-sand-200 bg-white/50 text-cocoa-700 hover:border-lagoon-300 focus-visible:outline-lagoon-400",
  };

  return (
    <button className={clsx(base, variants[variant], className)} {...props} />
  );
}
