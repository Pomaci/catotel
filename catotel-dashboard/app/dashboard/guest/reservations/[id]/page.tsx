"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import type { ReactNode } from "react";
import {
  CalendarDays,
  Cat,
  CreditCard,
  DoorOpen,
  Info,
  Lock,
  ShieldAlert,
} from "lucide-react";
import { Card } from "@/components/Card";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { StatusBanner } from "@/components/ui/StatusBanner";
import { ConfirmDialog } from "@/components/guest/ConfirmDialog";
import { GuestStatusBadge } from "@/components/guest/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { reservationDetail } from "../../data";

const viewState: "loaded" | "loading" | "error" = "loaded";

const timelineSteps = [
  { key: "PENDING", label: "Talep alındı", helper: "Rezervasyon talebin oluşturuldu." },
  { key: "CONFIRMED", label: "Onaylandı", helper: "Otel ekibi rezervasyonu onayladı." },
  { key: "CHECKED_IN", label: "Check-in", helper: "Kedin otele giriş yaptı." },
  { key: "CHECKED_OUT", label: "Check-out", helper: "Konaklama tamamlandı." },
];

export default function GuestReservationDetailPage() {
  const params = useParams<{ id: string }>();
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const reservation = reservationDetail;
  const hasPendingPayment =
    reservation.payments?.some((payment) => payment.status === "PENDING") ?? false;
  const canCancel = ["PENDING", "CONFIRMED"].includes(reservation.status);

  if (viewState === "loading") {
    return <DetailSkeleton />;
  }

  if (viewState === "error") {
    return (
      <StatusBanner variant="error">
        Rezervasyon detayları yüklenemedi. Lütfen tekrar deneyin.
      </StatusBanner>
    );
  }

  const activeIndex = timelineSteps.findIndex((step) => step.key === reservation.status);

  return (
    <div className="space-y-6">
      <Card className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Rezervasyon detayı</p>
          <h1 className="text-2xl font-semibold text-cocoa-700">
            {reservation.roomType.name} · {reservation.code}
          </h1>
          <p className="text-sm text-slate-500">
            {formatDate(reservation.checkIn, { dateStyle: "medium" })} -{" "}
            {formatDate(reservation.checkOut, { dateStyle: "medium" })}
          </p>
          <p className="text-xs text-slate-400">ID: {params.id}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <GuestStatusBadge kind="reservation" status={reservation.status} />
          {hasPendingPayment ? (
            <button
              type="button"
              onClick={() => setPaymentOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-lagoon-500 px-4 py-2 text-sm font-semibold text-white shadow-glow transition hover:bg-lagoon-600"
            >
              <CreditCard className="h-4 w-4" aria-hidden />
              Online ödeme yap
            </button>
          ) : (
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
              Ödeme tamamlandı
            </span>
          )}
        </div>
      </Card>

      <Card>
        <SectionHeading title="Durum akışı" />
        <div className="mt-4 grid gap-4 md:grid-cols-4">
          {timelineSteps.map((step, index) => {
            const isActive = index <= activeIndex && reservation.status !== "CANCELLED";
            return (
              <div key={step.key} className="flex items-start gap-3 rounded-2xl border border-sand-200 bg-white/90 px-4 py-3">
                <span
                  className={
                    isActive
                      ? "flex h-8 w-8 items-center justify-center rounded-full bg-lagoon-500 text-white"
                      : "flex h-8 w-8 items-center justify-center rounded-full bg-sand-100 text-slate-400"
                  }
                >
                  {index + 1}
                </span>
                <div>
                  <p className="text-sm font-semibold text-cocoa-700">{step.label}</p>
                  <p className="text-xs text-slate-500">{step.helper}</p>
                </div>
              </div>
            );
          })}
          {reservation.status === "CANCELLED" && (
            <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white">!</span>
              <div>
                <p className="text-sm font-semibold text-red-600">İptal edildi</p>
                <p className="text-xs text-red-500">Rezervasyon iptal edildi.</p>
              </div>
            </div>
          )}
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="space-y-6">
          <Card>
            <SectionHeading title="Konaklama" />
            <div className="mt-4 grid gap-3 text-sm text-slate-500">
              <InfoRow
                icon={<CalendarDays className="h-4 w-4 text-lagoon-600" aria-hidden />}
                label="Tarihler"
                value={`${formatDate(reservation.checkIn, { dateStyle: "medium" })} - ${formatDate(
                  reservation.checkOut,
                  { dateStyle: "medium" },
                )}`}
              />
              <InfoRow
                icon={<DoorOpen className="h-4 w-4 text-lagoon-600" aria-hidden />}
                label="Oda tipi"
                value={reservation.roomType.name}
              />
              <InfoRow
                icon={<Cat className="h-4 w-4 text-lagoon-600" aria-hidden />}
                label="Kediler"
                value={reservation.cats.map((item) => item.cat.name).join(", ")}
              />
              <InfoRow
                icon={<Info className="h-4 w-4 text-lagoon-600" aria-hidden />}
                label="Oda paylaşımı"
                value={reservation.allowRoomSharing ? "Paylaşımlı" : "Özel oda"}
              />
              <InfoRow
                icon={<Info className="h-4 w-4 text-lagoon-600" aria-hidden />}
                label="Özel istekler"
                value={reservation.specialRequests ?? "Belirtilmedi"}
              />
            </div>
          </Card>

          <Card>
            <SectionHeading title="Oda ataması" />
            <div className="mt-4 space-y-3 text-sm text-slate-500">
              {reservation.roomAssignments?.length ? (
                reservation.roomAssignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    className="rounded-2xl border border-sand-200 bg-white/90 px-4 py-3"
                  >
                    <p className="text-sm font-semibold text-cocoa-700">{assignment.room.name}</p>
                    <p className="text-xs text-slate-500">
                      {assignment.catCount} kedi ·{" "}
                      {assignment.allowRoomSharing ? "Paylaşımlı" : "Özel oda"}
                    </p>
                    <p className="text-xs text-slate-400">
                      Kilitlenme: {assignment.lockedAt ? formatDate(assignment.lockedAt) : "Check-in sonrası"}
                    </p>
                  </div>
                ))
              ) : (
                <div className="flex items-center gap-3 rounded-2xl border border-sand-200 bg-white/90 px-4 py-3 text-sm text-slate-500">
                  <Lock className="h-4 w-4 text-lagoon-600" aria-hidden />
                  Odanız check-in sonrası sabitlenir.
                </div>
              )}
            </div>
          </Card>

          <Card>
            <SectionHeading title="Check-in bilgileri" />
            {reservation.checkInForm ? (
              <div className="mt-4 space-y-3 text-sm text-slate-500">
                <InfoRow
                  icon={<Info className="h-4 w-4 text-lagoon-600" aria-hidden />}
                  label="Teslim alınanlar"
                  value={reservation.checkInForm.deliveredItems?.map((item) => item.label).join(", ") ?? "-"}
                />
                <InfoRow
                  icon={<Info className="h-4 w-4 text-lagoon-600" aria-hidden />}
                  label="Beslenme planı"
                  value={
                    reservation.checkInForm.foodPlan
                      ? `${reservation.checkInForm.foodPlan.brand ?? ""} · ${
                          reservation.checkInForm.foodPlan.frequencyPerDay ?? "-"
                        } öğün`
                      : "-"
                  }
                />
                <InfoRow
                  icon={<Info className="h-4 w-4 text-lagoon-600" aria-hidden />}
                  label="İlaç planı"
                  value={
                    reservation.checkInForm.medicationPlan?.map((item) => item.name).join(", ") ?? "-"
                  }
                />
                <InfoRow
                  icon={<Info className="h-4 w-4 text-lagoon-600" aria-hidden />}
                  label="Not"
                  value={reservation.checkInForm.additionalNotes ?? "-"}
                />
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-500">
                Check-in bilgileri henüz doldurulmadı. Yakında buradan önceden paylaşabileceksin.
              </p>
            )}
          </Card>

          <Card>
            <SectionHeading title="Ek hizmetler" />
            {reservation.services.length ? (
              <div className="mt-4 space-y-2 text-sm text-slate-500">
                {reservation.services.map((service) => (
                  <div
                    key={service.id}
                    className="flex items-center justify-between rounded-2xl border border-sand-200 bg-white/90 px-4 py-3"
                  >
                    <span>{service.service.name}</span>
                    <span className="font-semibold text-cocoa-700">
                      {service.quantity} × {formatCurrency(service.unitPrice)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-500">Ek hizmet seçilmedi.</p>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <SectionHeading title="Ödemeler" />
            <div className="mt-4 space-y-3 text-sm text-slate-500">
              {reservation.payments?.length ? (
                reservation.payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="rounded-2xl border border-sand-200 bg-white/90 px-4 py-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-cocoa-700">{formatCurrency(payment.amount)}</span>
                      <GuestStatusBadge kind="payment" status={payment.status} />
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {payment.method} · {payment.processedAt ? formatDate(payment.processedAt) : "İşleniyor"}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">Ödeme kaydı bulunamadı.</p>
              )}
            </div>
          </Card>

          <Card className="border-red-200 bg-red-50/60">
            <SectionHeading title="İptal / Değişiklik" />
            <p className="mt-2 text-sm text-red-500">
              İptal işlemi geri alınamaz. Uygunsa rezervasyon iptal edilebilir.
            </p>
            {canCancel ? (
              <button
                type="button"
                onClick={() => setCancelOpen(true)}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full border border-red-200 bg-white/80 px-4 py-2 text-sm font-semibold text-red-500 transition hover:bg-red-100"
              >
                <ShieldAlert className="h-4 w-4" aria-hidden />
                Rezervasyonu iptal et
              </button>
            ) : (
              <div className="mt-4 flex items-center gap-2 rounded-2xl border border-red-200 bg-white/80 px-4 py-3 text-xs text-red-500">
                <Info className="h-4 w-4" aria-hidden />
                Bu aşamada iptal işlemi yapılamaz.
              </div>
            )}
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
        title="Ödemeyi onayla"
        description="Ödeme işlemi başlatılacak. Devam etmek istiyor musun?"
        confirmLabel="Ödemeye devam et"
        onConfirm={() => undefined}
      />
      <ConfirmDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title="Rezervasyonu iptal et"
        description="Rezervasyon iptal edilecek ve işlem geri alınamaz."
        confirmLabel="İptal et"
        tone="danger"
        onConfirm={() => undefined}
      />
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-sand-200 bg-white/90 px-4 py-3">
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-slate-400">
        {icon}
        {label}
      </div>
      <span className="text-sm text-cocoa-700">{value}</span>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-24 animate-pulse rounded-3xl bg-sand-100" />
      <div className="h-40 animate-pulse rounded-3xl bg-sand-100" />
      <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="space-y-6">
          <div className="h-52 animate-pulse rounded-3xl bg-sand-100" />
          <div className="h-52 animate-pulse rounded-3xl bg-sand-100" />
          <div className="h-52 animate-pulse rounded-3xl bg-sand-100" />
        </div>
        <div className="space-y-6">
          <div className="h-52 animate-pulse rounded-3xl bg-sand-100" />
          <div className="h-40 animate-pulse rounded-3xl bg-sand-100" />
        </div>
      </div>
    </div>
  );
}
