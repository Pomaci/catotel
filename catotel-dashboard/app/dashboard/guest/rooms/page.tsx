"use client";

import { useMemo, useState } from "react";
import { CalendarDays, HelpCircle, Hotel, Users } from "lucide-react";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { StatusBanner } from "@/components/ui/StatusBanner";
import { GuestEmptyState } from "@/components/guest/EmptyState";
import { formatCurrency } from "@/lib/utils/format";
import { roomTypes } from "../data";

const viewState: "loaded" | "loading" | "error" = "loaded";

const faqs = [
  {
    question: "Oda paylaşımı nedir?",
    answer: "Paylaşımlı odalarda kapasite uygunsa fiyat avantajı sunulur.",
  },
  {
    question: "Check-in ve check-out saatleri",
    answer: "Giriş/çıkış tarihe göre yapılır, saat bilgisi isteğe bağlıdır.",
  },
  {
    question: "İptal ve iade politikası",
    answer: "Rezervasyon detayında iptal koşulları görüntülenir.",
  },
];

export default function GuestRoomsPage() {
  const [checkIn, setCheckIn] = useState("2025-02-14");
  const [checkOut, setCheckOut] = useState("2025-02-18");
  const [catCount, setCatCount] = useState("1");

  const filteredRooms = useMemo(() => {
    const count = Number(catCount);
    if (!count) return roomTypes;
    return roomTypes.filter((room) => room.capacity >= count);
  }, [catCount]);

  if (viewState === "loading") {
    return <RoomsSkeleton />;
  }

  if (viewState === "error") {
    return (
      <StatusBanner variant="error">
        Oda tipleri yüklenemedi. Lütfen tekrar deneyin.
      </StatusBanner>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Oda tipleri</p>
          <h1 className="text-2xl font-semibold text-cocoa-700">Kedin için en uygun odayı seç</h1>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Input
            label="Check-in"
            type="date"
            value={checkIn}
            onChange={(event) => setCheckIn(event.target.value)}
          />
          <Input
            label="Check-out"
            type="date"
            value={checkOut}
            onChange={(event) => setCheckOut(event.target.value)}
          />
          <label className="flex flex-col gap-2 text-xs font-medium text-cocoa-600">
            <span className="uppercase tracking-[0.2em] text-slate-400">Kedi sayısı</span>
            <select
              className="rounded-2xl border border-sand-200 bg-white/80 px-4 py-3 text-sm text-cocoa-700 focus:border-lagoon-400 focus:outline-none focus:ring-2 focus:ring-lagoon-100"
              value={catCount}
              onChange={(event) => setCatCount(event.target.value)}
            >
              {[1, 2, 3].map((count) => (
                <option key={count} value={count}>
                  {count} kedi
                </option>
              ))}
            </select>
          </label>
        </div>
      </Card>

      {filteredRooms.length === 0 ? (
        <GuestEmptyState
          title="Bu tarihlerde uygun oda yok"
          description="Tarihleri veya kedi sayısını değiştirerek tekrar deneyebilirsin."
          actionLabel="Yeni tarih seç"
          actionHref="/dashboard/guest/rooms"
          icon={Hotel}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          {filteredRooms.map((room) => (
            <Card key={room.id} className="flex h-full flex-col gap-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-cocoa-700">{room.name}</p>
                  <p className="text-xs text-slate-500">{room.description}</p>
                </div>
                <span
                  className={
                    room.available
                      ? "rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700"
                      : "rounded-full bg-sand-200 px-3 py-1 text-xs font-semibold text-slate-500"
                  }
                >
                  {room.available ? "Uygun" : "Dolu"}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <CalendarDays className="h-4 w-4 text-lagoon-600" aria-hidden />
                {checkIn} - {checkOut}
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <Users className="h-4 w-4 text-lagoon-600" aria-hidden />
                Kapasite {room.capacity} kedi
              </div>
              <div className="rounded-2xl border border-sand-200 bg-white/90 px-4 py-3 text-sm text-cocoa-700">
                <p className="text-xs text-slate-500">Gecelik fiyat</p>
                <p className="text-lg font-semibold">{formatCurrency(room.nightlyRate)}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {((room.amenities as { highlights?: string[] } | null)?.highlights ?? []).map(
                  (amenity) => (
                    <span
                      key={amenity}
                      className="rounded-full border border-sand-200 bg-sand-100 px-3 py-1 text-xs text-cocoa-600"
                    >
                      {amenity}
                    </span>
                  ),
                )}
              </div>
              <button
                type="button"
                className="mt-auto inline-flex w-full items-center justify-center rounded-full bg-lagoon-500 px-4 py-2 text-sm font-semibold text-white shadow-glow transition hover:bg-lagoon-600"
              >
                Bu odayı seç
              </button>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <SectionHeading title="Sık sorulanlar" />
        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          {faqs.map((faq) => (
            <div key={faq.question} className="rounded-2xl border border-sand-200 bg-white/90 px-4 py-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-cocoa-700">
                <HelpCircle className="h-4 w-4 text-lagoon-600" aria-hidden />
                {faq.question}
              </div>
              <p className="mt-2 text-xs text-slate-500">{faq.answer}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function RoomsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-24 animate-pulse rounded-3xl bg-sand-100" />
      <div className="grid gap-4 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-72 animate-pulse rounded-3xl bg-sand-100" />
        ))}
      </div>
    </div>
  );
}
