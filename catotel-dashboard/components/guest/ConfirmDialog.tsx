"use client";

import { useEffect, useId } from "react";
import clsx from "clsx";
import { X } from "lucide-react";

type Props = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: "primary" | "danger";
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = "Vazgeç",
  tone = "primary",
  onConfirm,
  onOpenChange,
}: Props) {
  const titleId = useId();
  useEffect(() => {
    if (!open) return;
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onOpenChange(false);
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4 py-6 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onOpenChange(false);
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div className="w-full max-w-md rounded-3xl border border-sand-200 bg-white/95 p-6 shadow-soft">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
              Onay gerekiyor
            </p>
            <h3 id={titleId} className="mt-2 text-xl font-semibold text-cocoa-700">
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-full border border-sand-200 bg-white/90 p-2 text-slate-400 transition hover:border-lagoon-300"
            aria-label="Kapat"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
        <p className="mt-3 text-sm text-slate-500">{description}</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="inline-flex items-center justify-center rounded-full border border-sand-200 bg-white/90 px-4 py-2 text-sm font-semibold text-cocoa-700 transition hover:border-lagoon-300"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
            className={clsx(
              "inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold text-white shadow-glow transition",
              tone === "danger" ? "bg-red-500 hover:bg-red-600" : "bg-lagoon-500 hover:bg-lagoon-600",
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
