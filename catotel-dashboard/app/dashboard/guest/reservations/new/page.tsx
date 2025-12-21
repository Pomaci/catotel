"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import {
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  PawPrint,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { differenceInCalendarDays } from "date-fns";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { Checkbox } from "@/components/ui/Checkbox";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { StatusBanner } from "@/components/ui/StatusBanner";
import { GuestEmptyState } from "@/components/guest/EmptyState";
import { formatCurrency } from "@/lib/utils/format";
import { addonCatalog, roomTypes, sampleCats } from "../../data";

const viewState: "loaded" | "loading" | "error" = "loaded";

const steps = [
  { id: 1, label: "Tarihler", description: "Check-in / Check-out" },
  { id: 2, label: "Kediler", description: "Konaklayacak kediler" },
  { id: 3, label: "Oda Tipi", description: "Paylaşım seçimi" },
  { id: 4, label: "Ödeme", description: "Hizmetler ve onay" },
] as const;

export default function GuestNewReservationPage() {
  const [step, setStep] = useState(1);
  const [checkIn, setCheckIn] = useState("2025-02-14");
  const [checkOut, setCheckOut] = useState("2025-02-18");
  const [selectedCats, setSelectedCats] = useState<string[]>(
    sampleCats[0] ? [sampleCats[0].id] : [],
  );
  const [selectedRoomId, setSelectedRoomId] = useState(roomTypes[0]?.id ?? "");
  const [allowSharing, setAllowSharing] = useState(true);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return 0;
    const diff = differenceInCalendarDays(new Date(checkOut), new Date(checkIn));
    return diff > 0 ? diff : 0;
  }, [checkIn, checkOut]);

  const selectedRoom = roomTypes.find((room) => room.id === selectedRoomId);
  const baseTotal = selectedRoom ? Number(selectedRoom.nightlyRate) * nights : 0;
  const servicesTotal = selectedServices.reduce((total, id) => {
    const service = addonCatalog.find((item) => item.id === id);
    return total + (service ? Number(service.price) : 0);
  }, 0);
  const sharingDiscount = allowSharing ? baseTotal * 0.12 : 0;
  const total = Math.max(baseTotal - sharingDiscount + servicesTotal, 0);

  if (viewState === "loading") {
    return <ReservationWizardSkeleton />;
  }

  if (viewState === "error") {
    return (
      <StatusBanner variant="error">
        Rezervasyon ekranı yüklenemedi. Lütfen tekrar deneyin.
      </StatusBanner>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Yeni rezervasyon</p>
          <h1 className="text-2xl font-semibold text-cocoa-700">Kediniz için konaklama planlayın</h1>
          <p className="text-sm text-slate-500">
            Adım adım ilerleyin, fiyat ve uygunluk bilgileri anlık güncellenir.
          </p>
        </div>
        <Link
          href="/dashboard/guest/reservations"
          className="inline-flex items-center gap-2 rounded-full border border-sand-200 bg-white/90 px-4 py-2 text-sm font-semibold text-cocoa-700 transition hover:border-lagoon-300"
        >
          Rezervasyonlara dön
        </Link>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="space-y-6">
          <Card>
            <Stepper step={step} />
          </Card>

          {step === 1 && (
            <Card>
              <SectionHeading title="Tarihleri seç" />
              <p className="mt-2 text-sm text-slate-500">
                Otel günü bazlıdır: giriş ve çıkış tarihlerine göre hesaplanır.
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
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
              </div>
              <div className="mt-4 flex items-center gap-2 rounded-2xl bg-sand-100 px-4 py-3 text-xs text-slate-500">
                <CalendarDays className="h-4 w-4 text-lagoon-500" aria-hidden />
                {nights > 0 ? `${nights} gece konaklama` : "Tarihler geçerli değil"}
              </div>
            </Card>
          )}

          {step === 2 && (
            <Card>
              <SectionHeading title="Kedilerini seç" action={<span className="text-sm">Birden fazla seçebilirsin</span>} />
              {sampleCats.length === 0 ? (
                <GuestEmptyState
                  title="Kayıtlı kedi bulunamadı"
                  description="Önce kedini ekleyerek rezervasyona başlayabilirsin."
                  actionLabel="Yeni kedi ekle"
                  actionHref="/dashboard/guest/cats"
                  icon={PawPrint}
                  className="mt-6"
                />
              ) : (
                <div className="mt-4 grid gap-3">
                  {sampleCats.map((cat) => {
                    const isSelected = selectedCats.includes(cat.id);
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() =>
                          setSelectedCats((prev) =>
                            isSelected ? prev.filter((id) => id !== cat.id) : [...prev, cat.id],
                          )
                        }
                        className={clsx(
                          "flex items-center justify-between rounded-2xl border px-4 py-3 text-left transition",
                          isSelected
                            ? "border-lagoon-300 bg-lagoon-100/60"
                            : "border-sand-200 bg-white/90 hover:border-lagoon-200",
                        )}
                      >
                        <div>
                          <p className="text-sm font-semibold text-cocoa-700">{cat.name}</p>
                          <p className="text-xs text-slate-500">
                            {cat.breed ?? "Irk belirtilmemiş"} · {cat.weightKg ?? "-"} kg
                          </p>
                        </div>
                        <span
                          className={clsx(
                            "inline-flex h-6 w-6 items-center justify-center rounded-full border",
                            isSelected
                              ? "border-lagoon-400 bg-lagoon-500 text-white"
                              : "border-sand-200 bg-white text-transparent",
                          )}
                        >
                          <CheckCircle2 className="h-4 w-4" aria-hidden />
                        </span>
                      </button>
                    );
                  })}
                  <Link
                    href="/dashboard/guest/cats"
                    className="mt-2 inline-flex items-center justify-center rounded-full border border-sand-200 bg-white/90 px-4 py-2 text-sm font-semibold text-cocoa-700 transition hover:border-lagoon-300"
                  >
                    + Yeni kedi ekle
                  </Link>
                </div>
              )}
            </Card>
          )}

          {step === 3 && (
            <Card>
              <SectionHeading title="Oda tipini seç" />
              {roomTypes.length === 0 ? (
                <GuestEmptyState
                  title="Uygun oda bulunamadı"
                  description="Tarihleri değiştirerek tekrar deneyebilirsin."
                  actionLabel="Tarihleri değiştir"
                  actionHref="/dashboard/guest/reservations/new"
                  icon={CalendarDays}
                  className="mt-6"
                />
              ) : (
                <div className="mt-4 grid gap-3">
                  {roomTypes.map((room) => {
                    const isSelected = room.id === selectedRoomId;
                    const availableLabel = room.available ? "Uygun" : "Dolu";
                    return (
                      <button
                        key={room.id}
                        type="button"
                        onClick={() => setSelectedRoomId(room.id)}
                        className={clsx(
                          "rounded-2xl border px-4 py-4 text-left transition",
                          isSelected
                            ? "border-lagoon-300 bg-lagoon-100/60"
                            : "border-sand-200 bg-white/90 hover:border-lagoon-200",
                        )}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-cocoa-700">{room.name}</p>
                            <p className="text-xs text-slate-500">{room.description}</p>
                          </div>
                          <span
                            className={clsx(
                              "rounded-full px-3 py-1 text-xs font-semibold",
                              room.available
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-sand-200 text-slate-500",
                            )}
                          >
                            {availableLabel}
                          </span>
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                          <span>{formatCurrency(room.nightlyRate)} / gece</span>
                          <span>• Kapasite: {room.capacity}</span>
                          <span>• Boş slot: {room.availableSlots ?? "-"}</span>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {(
                            (room.amenities as { highlights?: string[] } | null | undefined)
                              ?.highlights ?? []
                          )
                            .slice(0, 3)
                            .map((amenity) => (
                              <span
                                key={amenity}
                                className="rounded-full border border-sand-200 bg-sand-100 px-3 py-1 text-xs text-cocoa-600"
                              >
                                {amenity}
                              </span>
                            ))}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-sand-200 bg-white/90 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-cocoa-700">Oda paylaşımı</p>
                  <p className="text-xs text-slate-500">Paylaşımlı seçersen fiyat düşer.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setAllowSharing((prev) => !prev)}
                  className={clsx(
                    "inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition",
                    allowSharing
                      ? "bg-lagoon-500 text-white shadow-glow"
                      : "border border-sand-200 bg-white/90 text-cocoa-700",
                  )}
                >
                  {allowSharing ? "Paylaşmak istiyorum" : "Özel oda istiyorum"}
                </button>
              </div>
            </Card>
          )}

          {step === 4 && (
            <Card>
              <SectionHeading title="Ek hizmetler ve ödeme" />
              <p className="mt-2 text-sm text-slate-500">
                İstersen konaklamaya ekstra bakım hizmetleri ekleyebilirsin.
              </p>
              <div className="mt-4 space-y-3">
                {addonCatalog.map((service) => {
                  const isSelected = selectedServices.includes(service.id);
                  return (
                    <button
                      key={service.id}
                      type="button"
                      onClick={() =>
                        setSelectedServices((prev) =>
                          isSelected ? prev.filter((id) => id !== service.id) : [...prev, service.id],
                        )
                      }
                      className={clsx(
                        "flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition",
                        isSelected
                          ? "border-lagoon-300 bg-lagoon-100/60"
                          : "border-sand-200 bg-white/90 hover:border-lagoon-200",
                      )}
                    >
                      <div>
                        <p className="text-sm font-semibold text-cocoa-700">{service.name}</p>
                        <p className="text-xs text-slate-500">{service.description}</p>
                      </div>
                      <span className="text-sm font-semibold text-cocoa-700">
                        {formatCurrency(service.price)}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 space-y-3 rounded-2xl border border-sand-200 bg-white/90 px-4 py-4 text-sm text-slate-500">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-4 w-4 text-lagoon-600" aria-hidden />
                  <span>Güvenli ödeme altyapısı ile korunur.</span>
                </div>
                <Checkbox label="Rezervasyon koşullarını okudum." />
                <Checkbox label="İptal politikasını kabul ediyorum." />
              </div>
            </Card>
          )}

          <WizardFooter
            step={step}
            onPrev={() => setStep((prev) => Math.max(prev - 1, 1))}
            onNext={() => setStep((prev) => Math.min(prev + 1, steps.length))}
          />
        </div>

        <div className="space-y-6 lg:sticky lg:top-6 lg:h-fit">
          <Card>
            <SectionHeading title="Fiyat özeti" />
            <div className="mt-4 space-y-3 text-sm text-slate-500">
              <SummaryRow label="Gece sayısı" value={`${nights} gece`} />
              <SummaryRow label="Oda tutarı" value={formatCurrency(baseTotal)} />
              <SummaryRow
                label="Paylaşım indirimi"
                value={allowSharing ? `- ${formatCurrency(sharingDiscount)}` : formatCurrency(0)}
              />
              <SummaryRow label="Ek hizmetler" value={formatCurrency(servicesTotal)} />
              <div className="my-3 h-px bg-sand-200" />
              <SummaryRow label="Toplam" value={formatCurrency(total)} emphasize />
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-white via-sand-50 to-peach-50/40">
            <SectionHeading title="Seçimlerin" />
            <div className="mt-4 space-y-3 text-sm text-slate-500">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-lagoon-600" aria-hidden />
                {checkIn} - {checkOut}
              </div>
              <div className="flex items-center gap-2">
                <PawPrint className="h-4 w-4 text-lagoon-600" aria-hidden />
                {selectedCats.length} kedi
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-lagoon-600" aria-hidden />
                {selectedRoom?.name ?? "Oda seçilmedi"}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Stepper({ step }: { step: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-4">
      {steps.map((item) => {
        const isActive = step === item.id;
        const isCompleted = step > item.id;
        return (
          <div key={item.id} className="flex items-start gap-3">
            <span
              className={clsx(
                "flex h-10 w-10 items-center justify-center rounded-2xl border text-sm font-semibold",
                isCompleted
                  ? "border-lagoon-500 bg-lagoon-500 text-white"
                  : isActive
                    ? "border-lagoon-400 bg-lagoon-100 text-lagoon-600"
                    : "border-sand-200 bg-white text-slate-400",
              )}
            >
              {item.id}
            </span>
            <div>
              <p className={clsx("text-sm font-semibold", isActive ? "text-cocoa-700" : "text-slate-500")}>
                {item.label}
              </p>
              <p className="text-xs text-slate-400">{item.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function WizardFooter({
  step,
  onPrev,
  onNext,
}: {
  step: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  const isLast = step === steps.length;
  return (
    <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <button
        type="button"
        onClick={onPrev}
        disabled={step === 1}
        className="inline-flex items-center justify-center rounded-full border border-sand-200 bg-white/90 px-5 py-2 text-sm font-semibold text-cocoa-700 transition disabled:cursor-not-allowed disabled:opacity-60"
      >
        Geri
      </button>
      <button
        type="button"
        onClick={onNext}
        className="inline-flex items-center justify-center gap-2 rounded-full bg-lagoon-500 px-5 py-2 text-sm font-semibold text-white shadow-glow transition hover:bg-lagoon-600"
      >
        {isLast ? "Rezervasyonu onayla" : "Devam et"}
        <ChevronRight className="h-4 w-4" aria-hidden />
      </button>
    </Card>
  );
}

function SummaryRow({ label, value, emphasize }: { label: string; value: string; emphasize?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span>{label}</span>
      <span className={emphasize ? "text-lg font-semibold text-cocoa-700" : "text-cocoa-700"}>
        {value}
      </span>
    </div>
  );
}

function ReservationWizardSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
      <div className="space-y-6">
        <div className="h-32 animate-pulse rounded-3xl bg-sand-100" />
        <div className="h-64 animate-pulse rounded-3xl bg-sand-100" />
        <div className="h-24 animate-pulse rounded-3xl bg-sand-100" />
      </div>
      <div className="space-y-6">
        <div className="h-48 animate-pulse rounded-3xl bg-sand-100" />
        <div className="h-40 animate-pulse rounded-3xl bg-sand-100" />
      </div>
    </div>
  );
}
