"use client";

import { ReactNode } from "react";
import Link from "next/link";

type Props = {
  hero?: ReactNode;
  children: ReactNode;
  slim?: boolean;
};

export function AuthShell({ hero, children, slim }: Props) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFF7EC] via-[#FEF9F4] to-[#F5F7FB] px-4 py-8">
      <div className="pointer-events-none fixed inset-0 opacity-20">
        <div className="absolute left-10 top-20 h-64 w-64 rounded-full bg-peach-100 blur-[80px]" />
        <div className="absolute right-20 bottom-10 h-72 w-72 rounded-full bg-lagoon-100 blur-[90px]" />
      </div>
      <div className="relative z-10 mx-auto flex max-w-6xl flex-col gap-8">
        <header className="flex items-center justify-between text-sm text-slate-500">
          <Link href="/" className="flex items-center gap-3 font-semibold text-cocoa-700">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-sand-200 text-lg text-lagoon-600">
              🐱
            </span>
            Miaow Hotel
          </Link>
          <Link
            href="#"
            className="font-semibold text-lagoon-600 transition hover:underline"
          >
            Yardım
          </Link>
        </header>

        <div
          className={`grid gap-8 ${
            hero && !slim ? "lg:grid-cols-[1.05fr,_0.95fr]" : ""
          } items-center`}
        >
          {hero && !slim && <div>{hero}</div>}
          <div className={hero && !slim ? "" : "max-w-lg mx-auto"}>{children}</div>
        </div>
      </div>
    </div>
  );
}

