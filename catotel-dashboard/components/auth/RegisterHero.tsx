"use client";

import Image from "next/image";
import { SunMedium, BedDoubleIcon, ToyBrick } from "lucide-react";

export function RegisterHero() {
  return (
    <section className="rounded-[40px] bg-gradient-to-br from-sand-50 via-white to-lagoon-50 p-8 shadow-soft">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="relative h-64 w-full overflow-hidden rounded-3xl bg-sand-50">
          <Image
            src="/auth-signup.svg"
            alt="Kayıt illüstrasyonu"
            fill
            className="object-cover"
            priority
          />
        </div>
        <div className="space-y-6">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-lagoon-500">
              Seyahate çık, kedin tatilde kalsın.
            </p>
            <h1 className="text-3xl font-semibold text-cocoa-700">
              Miaow Hotel odalarında güneş ışığı, yumuşacık minderler ve oyun alanları hazır.
            </h1>
            <p className="text-sm text-slate-500">
              Kayıt oluşturduktan sonra kedinin profiline özel bakım planları oluşturabilirsin.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3 text-sm text-cocoa-700">
            {[
              {
                icon: SunMedium,
                title: "Güneşli odalar",
              },
              { icon: BedDoubleIcon, title: "Rahat minderler" },
              { icon: ToyBrick, title: "Oyun alanları" },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-3xl border border-sand-200 bg-white/80 p-4 text-center"
              >
                <item.icon className="mx-auto mb-2 h-5 w-5 text-lagoon-600" aria-hidden />
                {item.title}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
