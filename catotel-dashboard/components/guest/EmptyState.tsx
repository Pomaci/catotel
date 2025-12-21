"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import clsx from "clsx";

type Props = {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  icon?: LucideIcon;
  className?: string;
};

export function GuestEmptyState({
  title,
  description,
  actionLabel,
  actionHref,
  icon: Icon,
  className,
}: Props) {
  return (
    <div
      className={clsx(
        "flex flex-col items-center gap-3 rounded-3xl border border-dashed border-sand-200 bg-white/80 px-6 py-10 text-center shadow-soft",
        className,
      )}
    >
      {Icon && (
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sand-100 text-lagoon-600">
          <Icon className="h-6 w-6" aria-hidden />
        </span>
      )}
      <div>
        <p className="text-lg font-semibold text-cocoa-700">{title}</p>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
      {actionLabel && actionHref ? (
        <Link
          href={actionHref}
          className="inline-flex items-center justify-center rounded-full bg-lagoon-500 px-5 py-2 text-sm font-semibold text-white shadow-glow transition hover:bg-lagoon-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lagoon-500"
        >
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
