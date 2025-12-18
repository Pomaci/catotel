"use client";

import Link from "next/link";

type UnderConstructionProps = {
  label?: string;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
};

export function UnderConstruction({
  label,
  description,
  actionHref = "/",
  actionLabel = "← Ana sayfaya dön",
}: UnderConstructionProps) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="surface-card max-w-md space-y-4 text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
          {label ?? "Yapım Aşamasında"}
        </p>
        <h1 className="text-2xl font-semibold text-cocoa-700">
          Bu alan çok yakında hazır olacak.
        </h1>
        <p className="text-sm text-slate-500">
          {description ??
            "Şu anda sadece giriş/kayıt deneyimini açıktır. Dashboard modülleri tamamlandığında burada görünecek."}
        </p>
        <Link
          href={actionHref}
          className="inline-flex items-center justify-center rounded-full bg-lagoon-500 px-5 py-2 text-sm font-semibold text-white shadow-glow"
        >
          {actionLabel}
        </Link>
      </div>
    </div>
  );
}
