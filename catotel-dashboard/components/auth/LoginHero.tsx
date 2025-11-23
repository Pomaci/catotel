"use client";

import Image from "next/image";
import { PawPrint, UtensilsCrossed, Heart } from "lucide-react";

const benefits = [
  { icon: PawPrint, text: "Canlı kamera ile 7/24 izleme" },
  { icon: UtensilsCrossed, text: "Özel beslenme planları" },
  { icon: Heart, text: "Veteriner onaylı bakım" },
];

export function LoginHero() {
  return (
    <section className="rounded-[40px] bg-white p-8 shadow-soft">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="relative h-64 w-full overflow-hidden rounded-3xl bg-sand-50">
          <Image
            src="/auth-login.svg"
            alt="Kedi oteli illüstrasyonu"
            fill
            className="object-cover"
            priority
          />
        </div>
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-[0.3em] text-peach-400">
            Catotel
          </p>
          <h1 className="text-3xl font-semibold text-cocoa-700">
            Kedine beş yıldızlı konfor
          </h1>
          <p className="text-sm text-slate-500">
            Konaklama rezervasyonlarını takip et, kedini canlı izleme kameraları ile kontrol et.
          </p>
          <ul className="space-y-3 text-sm text-cocoa-600">
            {benefits.map((benefit) => (
              <li key={benefit.text} className="flex items-center gap-3">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-sand-100 text-lagoon-600">
                  <benefit.icon className="h-4 w-4" aria-hidden />
                </span>
                {benefit.text}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
