"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  Camera,
  Cat,
  HeartPulse,
  PawPrint,
  Search,
  Stethoscope,
} from "lucide-react";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { StatusBanner } from "@/components/ui/StatusBanner";
import { GuestEmptyState } from "@/components/guest/EmptyState";
import { sampleCats } from "../data";

const viewState: "loaded" | "loading" | "error" = "loaded";

export default function GuestCatsPage() {
  const [query, setQuery] = useState("");

  const filteredCats = useMemo(() => {
    if (!query.trim()) return sampleCats;
    const term = query.toLowerCase();
    return sampleCats.filter((cat) =>
      [cat.name, cat.breed, cat.gender].some(
        (value) => typeof value === "string" && value.toLowerCase().includes(term),
      ),
    );
  }, [query]);

  if (viewState === "loading") {
    return <CatsSkeleton />;
  }

  if (viewState === "error") {
    return (
      <StatusBanner variant="error">
        Kediler yüklenemedi. Lütfen tekrar deneyin.
      </StatusBanner>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
      <div className="space-y-6">
        <Card>
          <SectionHeading title="Kedilerim" />
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Input
              label="Arama"
              placeholder="İsim, ırk veya cinsiyet"
              leadingIcon={<Search className="h-4 w-4" />}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
        </Card>

        {filteredCats.length === 0 ? (
          <GuestEmptyState
            title="Henüz kedi eklemedin"
            description="Kedinin profilini ekleyerek rezervasyon oluşturabilirsin."
            actionLabel="Yeni kedi ekle"
            actionHref="/dashboard/guest/cats"
            icon={Cat}
          />
        ) : (
          <div className="grid gap-4">
            {filteredCats.map((cat) => (
              <CatCard key={cat.id} cat={cat} />
            ))}
          </div>
        )}
      </div>

      <Card className="lg:sticky lg:top-6">
        <SectionHeading title="Yeni kedi ekle" />
        <p className="mt-2 text-sm text-slate-500">
          Kedinin temel bilgilerini ekle; diyet ve sağlık notları rezervasyonlarda görünür.
        </p>
        <div className="mt-4 space-y-4 text-sm text-slate-500">
          <Input label="İsim" placeholder="Mia" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Irk" placeholder="British Shorthair" />
            <Input label="Cinsiyet" placeholder="Dişi" />
          </div>
          <Input label="Kilo (kg)" placeholder="4.2" />
          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
              Diyet notları
            </label>
            <textarea
              rows={3}
              className="w-full rounded-2xl border border-sand-200 bg-white/80 px-4 py-3 text-sm text-cocoa-700 placeholder:text-slate-400 focus:border-lagoon-400 focus:outline-none focus:ring-2 focus:ring-lagoon-100"
              placeholder="Tahılsız mama, akşam 20:00"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
              Medikal notlar
            </label>
            <textarea
              rows={3}
              className="w-full rounded-2xl border border-sand-200 bg-white/80 px-4 py-3 text-sm text-cocoa-700 placeholder:text-slate-400 focus:border-lagoon-400 focus:outline-none focus:ring-2 focus:ring-lagoon-100"
              placeholder="Alerji, ilaç programı vb."
            />
          </div>
          <button
            type="button"
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-lagoon-500 px-4 py-2 text-sm font-semibold text-white shadow-glow transition hover:bg-lagoon-600"
          >
            <Camera className="h-4 w-4" aria-hidden />
            Fotoğraf yükle
          </button>
          <button
            type="button"
            className="inline-flex w-full items-center justify-center rounded-full border border-sand-200 bg-white/90 px-4 py-2 text-sm font-semibold text-cocoa-700 transition hover:border-lagoon-300"
          >
            Kaydet
          </button>
        </div>
      </Card>
    </div>
  );
}

function CatCard({ cat }: { cat: (typeof sampleCats)[number] }) {
  return (
    <Card className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-lagoon-100 text-lagoon-600">
        <PawPrint className="h-6 w-6" aria-hidden />
      </div>
      <div className="flex-1">
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-lg font-semibold text-cocoa-700">{cat.name}</p>
          <span className="rounded-full border border-sand-200 bg-sand-100 px-3 py-1 text-xs text-cocoa-600">
            {cat.breed ?? "Irk belirtilmemiş"}
          </span>
        </div>
        <p className="text-sm text-slate-500">
          {cat.gender ?? "-"} · {cat.weightKg ?? "-"} kg
        </p>
        <div className="mt-3 grid gap-2 text-xs text-slate-500 sm:grid-cols-2">
          <InfoPill icon={<HeartPulse className="h-4 w-4" aria-hidden />} label="Diyet">
            {cat.dietaryNotes ?? "Belirtilmedi"}
          </InfoPill>
          <InfoPill icon={<Stethoscope className="h-4 w-4" aria-hidden />} label="Medikal">
            {cat.medicalNotes ?? "Belirtilmedi"}
          </InfoPill>
        </div>
      </div>
      <button
        type="button"
        className="inline-flex items-center justify-center rounded-full border border-sand-200 bg-white/90 px-4 py-2 text-sm font-semibold text-cocoa-700 transition hover:border-lagoon-300"
      >
        Profili düzenle
      </button>
    </Card>
  );
}

function InfoPill({ icon, label, children }: { icon: ReactNode; label: string; children: string }) {
  return (
    <div className="flex items-start gap-2 rounded-2xl border border-sand-200 bg-white/80 px-3 py-2">
      <span className="mt-0.5 text-lagoon-600">{icon}</span>
      <div>
        <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">{label}</p>
        <p className="text-xs text-cocoa-600">{children}</p>
      </div>
    </div>
  );
}

function CatsSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
      <div className="space-y-4">
        <div className="h-24 animate-pulse rounded-3xl bg-sand-100" />
        <div className="h-32 animate-pulse rounded-3xl bg-sand-100" />
        <div className="h-32 animate-pulse rounded-3xl bg-sand-100" />
      </div>
      <div className="h-96 animate-pulse rounded-3xl bg-sand-100" />
    </div>
  );
}
