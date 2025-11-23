"use client";

import { InputHTMLAttributes, ReactNode, forwardRef } from "react";
import clsx from "clsx";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  helperText?: string;
  error?: string;
};

export const Input = forwardRef<HTMLInputElement, Props>(function Input(
  { label, leadingIcon, trailingIcon, helperText, error, className, ...props },
  ref,
) {
  const hasError = Boolean(error);
  return (
    <label className="flex flex-col gap-2 text-xs font-medium text-cocoa-600">
      {label && (
        <span className="uppercase tracking-[0.2em] text-slate-400">
          {label}
        </span>
      )}
      <div
        className={clsx(
          "flex items-center rounded-2xl border bg-white/80 text-sm text-cocoa-700 transition focus-within:ring-2",
          hasError
            ? "border-red-300 focus-within:border-red-300 focus-within:ring-red-50"
            : "border-sand-200 focus-within:border-lagoon-400 focus-within:ring-lagoon-100",
          className,
        )}
      >
        {leadingIcon && (
          <span className="pl-4 text-slate-400" aria-hidden>
            {leadingIcon}
          </span>
        )}
        <input
          ref={ref}
          className={clsx(
            "w-full bg-transparent px-4 py-3 placeholder:text-slate-400 focus:outline-none",
            leadingIcon && "pl-2",
            trailingIcon && "pr-2",
          )}
          {...props}
        />
        {trailingIcon && (
          <span className="pr-4 text-slate-400" aria-hidden>
            {trailingIcon}
          </span>
        )}
      </div>
      {(helperText || error) && (
        <p
          className={clsx(
            "text-[11px]",
            hasError ? "text-red-500" : "text-slate-500",
          )}
        >
          {error ?? helperText}
        </p>
      )}
    </label>
  );
});
