"use client";

import { InputHTMLAttributes, ReactNode } from "react";
import clsx from "clsx";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: ReactNode;
};

export function Checkbox({ label, className, ...props }: Props) {
  return (
    <label className={clsx("flex items-center gap-3 text-sm text-cocoa-600", className)}>
      <input
        type="checkbox"
        className="h-4 w-4 rounded border-sand-300 text-peach-400 focus:ring-peach-300"
        {...props}
      />
      <span>{label}</span>
    </label>
  );
}
