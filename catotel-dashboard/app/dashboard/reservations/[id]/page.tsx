"use client";

import { useMemo } from "react";
import clsx from "clsx";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import {
  AlertTriangle,
  CalendarRange,
  Cat,
  Check,
  CheckCircle2,
  Clock3,
  DoorOpen,
  Download,
  Edit3,
  Ellipsis,
  FileText,
  Home,
  Info,
  NotebookPen,
  PawPrint,
  User,
  XCircle,
} from "lucide-react";
import { HotelApi } from "@/lib/api/hotel";
import type { Reservation } from "@/types/hotel";
import { ReservationStatus } from "@/types/enums";

export default function ReservationDetailPage() {
  const params = useParams<{ id: string }>();
  const reservationId = params?.id;

  const { data: reservation, isLoading, error } = useQuery({
    queryKey: ["reservation", reservationId],
    enabled: Boolean(reservationId),
    queryFn: () => HotelApi.getReservation(reservationId!),
  });

  const trail = useMemo(() => buildTimeline(reservation?.status), [reservation?.status]);

  if (isLoading) {
    return (
      <div className="admin-surface p-6">
        <p className="text-sm font-semibold text-[var(--admin-muted)]">Rezervasyon yükleniyor...</p>
      </div>
    );
  }

  if (error || !reservation) {
    return (
      <div className="admin-surface p-6">
        <p className="text-sm font-semibold text-red-500">
          Rezervasyon yüklenemedi. {error instanceof Error ? error.message : ""}
        </p>
      </div>
    );
  }

  const totalExtras = reservation.services?.reduce((sum, s) => sum + Number(s.unitPrice) * s.quantity, 0) ?? 0;
  const nights = calculateNights(reservation.checkIn, reservation.checkOut);

  return (
    <div className="space-y-6">
      <HeaderCard reservation={reservation} nights={nights} />

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="space-y-4">
          <InfoCard reservation={reservation} />
          <StayCard reservation={reservation} nights={nights} />
          <ExtrasCard reservation={reservation} totalExtras={totalExtras} />
          <NotesCard reservation={reservation} />
        </div>
        <div className="space-y-4">
          <TimelineCard trail={trail} />
          <OperationsCard reservation={reservation} />
          <PaymentCard reservation={reservation} totalExtras={totalExtras} />
        </div>
      </div>

      <TabsSection />
    </div>
  );
}

function HeaderCard({ reservation, nights }: { reservation: Reservation; nights: number }) {
  const primaryCat = reservation.cats[0]?.cat;
  return (
    <div className="admin-surface flex flex-col gap-4 p-6 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--admin-highlight-muted)] text-peach-500">
          <Home className="h-5 w-5" aria-hidden />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-[var(--admin-text-strong)]">Rezervasyon #{reservation.code}</h1>
          <p className="mt-1 text-sm text-[var(--admin-muted)]">
            Müşteri: {reservation.customer?.user.name ?? "Bilinmiyor"} • Kedi: {primaryCat?.name ?? "?"}{" "}
            {primaryCat?.breed ? `(${primaryCat.breed})` : ""}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-semibold">
            <span className="status-badge" data-variant={mapStatus(reservation.status)}>
              {formatStatus(reservation.status)}
            </span>
            <span className="admin-chip">
              <CalendarRange className="h-3.5 w-3.5" aria-hidden />
              {nights} gece
            </span>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold text-[var(--admin-text-strong)] transition hover:-translate-y-0.5 hover:border-peach-300 hover:text-peach-500 admin-border"
        >
          <Edit3 className="h-4 w-4" aria-hidden />
          Düzenle
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold text-red-500 transition hover:-translate-y-0.5 hover:border-red-300 admin-border"
        >
          <XCircle className="h-4 w-4" aria-hidden />
          İptal Et
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-2 text-sm font-semibold text-peach-500 hover:underline"
        >
          <FileText className="h-4 w-4" aria-hidden />
          Faturayı Görüntüle
        </button>
        <button
          type="button"
          aria-label="Daha fazla"
          className="rounded-full border bg-[var(--admin-surface-alt)] p-2 text-[var(--admin-muted)] transition hover:-translate-y-0.5 hover:border-peach-300 hover:text-peach-500 admin-border"
        >
          <Ellipsis className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}

function CardShell({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="admin-surface p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-[0.25em] text-[var(--admin-muted)]">{title}</h2>
        {action}
      </div>
      <div className="space-y-3 text-[var(--admin-text-strong)]">{children}</div>
    </div>
  );
}

function InfoCard({ reservation }: { reservation: Reservation }) {
  return (
    <CardShell
      title="Müşteri & Kediler"
      action={
        <button type="button" className="text-xs font-semibold text-peach-500 hover:underline">
          Müşteri profilini aç →
        </button>
      }
    >
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-3 rounded-2xl bg-[var(--admin-surface-alt)] px-4 py-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--admin-highlight-muted)] text-peach-500">
            <User className="h-4 w-4" aria-hidden />
          </div>
          <div>
            <p className="text-base font-semibold">{reservation.customer?.user.name ?? "Bilinmiyor"}</p>
            <p className="text-xs text-[var(--admin-muted)]">
              {reservation.customer?.user.email ?? "E-posta yok"} • {reservation.customer?.user.name ? "" : ""}
            </p>
          </div>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {reservation.cats.map((catEntry) => (
          <div
            key={catEntry.cat.id}
            className="flex items-center gap-3 rounded-2xl border px-3 py-2 admin-border"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--admin-highlight-muted)] text-peach-500">
              <Cat className="h-4 w-4" aria-hidden />
            </div>
            <div>
              <p className="font-semibold">{catEntry.cat.name}</p>
              <p className="text-xs text-[var(--admin-muted)]">{catEntry.cat.breed ?? "Cins bilinmiyor"}</p>
            </div>
          </div>
        ))}
      </div>
    </CardShell>
  );
}

function StayCard({ reservation, nights }: { reservation: Reservation; nights: number }) {
  return (
    <CardShell
      title="Konaklama"
      action={
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold text-[var(--admin-text-strong)] transition hover:-translate-y-0.5 hover:border-peach-300 hover:text-peach-500 admin-border"
        >
          <DoorOpen className="h-4 w-4" aria-hidden />
          Oda değiştir
        </button>
      }
    >
      <div className="grid gap-3 md:grid-cols-2">
        <div className="flex items-center gap-2 rounded-2xl bg-[var(--admin-surface-alt)] px-3 py-3">
          <Home className="h-4 w-4 text-peach-400" aria-hidden />
          <div>
            <p className="text-sm font-semibold">
              {reservation.room.name} ({reservation.room.type})
            </p>
            <p className="text-xs text-[var(--admin-muted)]">{reservation.room.description ?? "Oda detayı"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-2xl bg-[var(--admin-surface-alt)] px-3 py-3">
          <CalendarRange className="h-4 w-4 text-peach-400" aria-hidden />
          <div>
            <p className="text-sm font-semibold">
              Giriş: {formatDateTime(reservation.checkIn)} • Çıkış: {formatDateTime(reservation.checkOut)}
            </p>
            <p className="text-xs text-[var(--admin-muted)]">{nights} gece</p>
          </div>
        </div>
      </div>
    </CardShell>
  );
}

function ExtrasCard({ reservation, totalExtras }: { reservation: Reservation; totalExtras: number }) {
  return (
    <CardShell title="Ek Hizmetler">
      <div className="space-y-2">
        {reservation.services.length === 0 && (
          <p className="text-sm text-[var(--admin-muted)]">Ek hizmet bulunmuyor.</p>
        )}
        {reservation.services.map((service) => (
          <div
            key={service.id}
            className="flex items-center justify-between rounded-2xl border px-3 py-2 text-sm admin-border"
          >
            <div className="flex items-center gap-2">
              <PawPrint className="h-4 w-4 text-peach-400" aria-hidden />
              <div>
                <p className="font-semibold">{service.service.name}</p>
                <p className="text-xs text-[var(--admin-muted)]">Adet: {service.quantity}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">
                {formatCurrency(Number(service.unitPrice) * service.quantity)}
              </span>
              <button
                type="button"
                className="rounded-full p-1 text-[var(--admin-muted)] transition hover:text-peach-500"
              >
                <Edit3 className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center justify-between text-sm font-semibold">
        <span>Toplam ek hizmet</span>
        <span>{formatCurrency(totalExtras)}</span>
      </div>
    </CardShell>
  );
}

function NotesCard({ reservation }: { reservation: Reservation }) {
  return (
    <CardShell
      title="Notlar"
      action={
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold text-[var(--admin-text-strong)] transition hover:-translate-y-0.5 hover:border-peach-300 hover:text-peach-500 admin-border"
        >
          <NotebookPen className="h-4 w-4" aria-hidden />
          Notları düzenle
        </button>
      }
    >
      <div className="space-y-2 rounded-2xl bg-[var(--admin-surface-alt)] p-3">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--admin-muted)]">Müşteri notu</p>
        <p className="text-sm leading-relaxed text-[var(--admin-text-strong)]">
          {reservation.specialRequests ?? "Not yok"}
        </p>
      </div>
      <div className="space-y-2 rounded-2xl bg-[var(--admin-surface-alt)] p-3">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--admin-muted)]">Operasyon notu</p>
        <p className="text-sm leading-relaxed text-[var(--admin-text-strong)]">
          {reservation.services.length
            ? "Ek hizmetler planlandı, operasyonu takip edin."
            : "İç operasyon notu girilmedi."}
        </p>
      </div>
    </CardShell>
  );
}

function TimelineCard({ trail }: { trail: Array<{ label: string; at: string; state: "done" | "active" | "pending" | "disabled" }> }) {
  return (
    <CardShell title="Durum" action={<span className="status-badge" data-variant="checkin">Akış</span>}>
      <div className="timeline">
        {trail.map((step) => (
          <div key={step.label} className="timeline__item">
            <div
              className={clsx(
                "timeline__icon",
                step.state === "done" && "is-done",
                step.state === "active" && "is-active",
                step.state === "pending" && "is-pending",
                step.state === "disabled" && "is-disabled",
              )}
            >
              {step.state === "done" && <Check className="h-3.5 w-3.5" aria-hidden />}
              {step.state === "active" && <Clock3 className="h-3.5 w-3.5" aria-hidden />}
              {step.state === "pending" && <Info className="h-3.5 w-3.5" aria-hidden />}
              {step.state === "disabled" && <AlertTriangle className="h-3.5 w-3.5" aria-hidden />}
            </div>
            <div className="timeline__line" aria-hidden />
            <div>
              <p className="text-sm font-semibold">{step.label}</p>
              <p className="text-xs text-[var(--admin-muted)]">{step.at}</p>
            </div>
          </div>
        ))}
      </div>
    </CardShell>
  );
}

function OperationsCard({ reservation }: { reservation: Reservation }) {
  return (
    <CardShell title="Operasyon">
      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white shadow transition hover:-translate-y-0.5 hover:shadow-lg"
        >
          <CheckCircle2 className="h-4 w-4" aria-hidden />
          Check-in Yap
        </button>
        <button
          type="button"
          className="flex items-center justify-center gap-2 rounded-2xl bg-peach-400 px-4 py-3 text-sm font-semibold text-white shadow transition hover:-translate-y-0.5 hover:shadow-lg"
        >
          <DoorOpen className="h-4 w-4" aria-hidden />
          Check-out Yap
        </button>
      </div>
      <div className="rounded-2xl bg-[var(--admin-surface-alt)] px-4 py-3 text-sm">
        <p className="flex items-center gap-2 text-[var(--admin-muted)]">
          <Clock3 className="h-4 w-4" aria-hidden />
          Planlanan giriş: {formatDateTime(reservation.checkIn)}
        </p>
        <p className="mt-1 flex items-center gap-2 text-[var(--admin-muted)]">
          <Clock3 className="h-4 w-4" aria-hidden />
          Planlanan çıkış: {formatDateTime(reservation.checkOut)}
        </p>
      </div>
    </CardShell>
  );
}

function PaymentCard({ reservation, totalExtras }: { reservation: Reservation; totalExtras: number }) {
  return (
    <CardShell title="Ödeme">
      <div className="flex items-center justify-between">
        <p className="text-lg font-semibold">Toplam: {formatCurrency(reservation.totalPrice)}</p>
        <span className="status-badge" data-variant="checkin">
          Ödeme Durumu
        </span>
      </div>
      <div className="space-y-1 rounded-2xl bg-[var(--admin-surface-alt)] p-3 text-sm">
        <Line label="Oda ücreti" value={formatCurrency(reservation.totalPrice)} />
        <Line label="Ek hizmetler" value={formatCurrency(totalExtras)} />
        <Line label="Ön ödeme" value={formatCurrency(0)} />
      </div>
      <button
        type="button"
        className="inline-flex items-center gap-2 rounded-full bg-peach-400 px-4 py-2 text-sm font-semibold text-white shadow-glow transition hover:-translate-y-0.5"
      >
        <Download className="h-4 w-4" aria-hidden />
        Ödeme Al
      </button>
    </CardShell>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm font-semibold text-[var(--admin-text-strong)]">
      <span className="text-[var(--admin-muted)]">{label}</span>
      <span>{value}</span>
    </div>
  );
}

function TabsSection() {
  const tabs = ["Günlük Raporlar", "Medya", "Geçmiş İşlemler", "Formlar", "Mesajlar"];
  return (
    <div className="admin-surface p-5">
      <div className="flex flex-wrap items-center gap-2">
        {tabs.map((tab, idx) => (
          <button
            // eslint-disable-next-line react/no-array-index-key
            key={idx}
            type="button"
            className={clsx(
              "rounded-full px-4 py-2 text-sm font-semibold transition",
              idx === 0
                ? "bg-[var(--admin-highlight-muted)] text-[var(--admin-text-strong)] shadow-sm"
                : "text-[var(--admin-muted)] hover:text-[var(--admin-text-strong)] hover:bg-[var(--admin-highlight-muted)]/60",
            )}
          >
            {tab}
          </button>
        ))}
      </div>
      <div className="mt-4 rounded-2xl border border-dashed border-[var(--admin-border)] bg-[var(--admin-surface-alt)] p-6 text-sm text-[var(--admin-muted)]">
        Bu sekme içeriği yakında. Günlük raporlar, medya ve işlemler burada listelenecek.
      </div>
    </div>
  );
}

function buildTimeline(status?: ReservationStatus) {
  const steps = [
    { key: ReservationStatus.PENDING, label: "Oluşturuldu" },
    { key: ReservationStatus.CONFIRMED, label: "Onaylandı" },
    { key: ReservationStatus.CHECKED_IN, label: "Check-in" },
    { key: ReservationStatus.CHECKED_OUT, label: "Check-out" },
    { key: ReservationStatus.CANCELLED, label: "İptal" },
  ];
  return steps.map((step, idx) => {
    let state: "done" | "active" | "pending" | "disabled" = "pending";
    if (status === step.key) {
      state = "active";
    } else if (isLaterStatus(status, step.key)) {
      state = "done";
    } else if (status === ReservationStatus.CANCELLED && step.key !== ReservationStatus.CANCELLED) {
      state = "disabled";
    }
    return { label: step.label, at: idx === 0 ? "Oluşturma tarihi" : "Plan", state };
  });
}

function isLaterStatus(current: ReservationStatus | undefined, step: ReservationStatus) {
  if (!current) return false;
  const order = [
    ReservationStatus.PENDING,
    ReservationStatus.CONFIRMED,
    ReservationStatus.CHECKED_IN,
    ReservationStatus.CHECKED_OUT,
    ReservationStatus.CANCELLED,
  ];
  return order.indexOf(current) > order.indexOf(step);
}

function mapStatus(status: ReservationStatus) {
  if (status === ReservationStatus.PENDING) return "created";
  if (status === ReservationStatus.CONFIRMED) return "confirmed";
  if (status === ReservationStatus.CHECKED_IN) return "checkin";
  if (status === ReservationStatus.CHECKED_OUT) return "checkout";
  return "cancelled";
}

function formatStatus(status: ReservationStatus) {
  if (status === ReservationStatus.PENDING) return "Oluşturuldu";
  if (status === ReservationStatus.CONFIRMED) return "Onaylandı";
  if (status === ReservationStatus.CHECKED_IN) return "Check-in";
  if (status === ReservationStatus.CHECKED_OUT) return "Check-out";
  if (status === ReservationStatus.CANCELLED) return "İptal";
  return status;
}

function formatDateTime(value: string) {
  const d = new Date(value);
  return d.toLocaleString("tr-TR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function calculateNights(checkIn: string, checkOut: string) {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const diff = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
  return Math.max(1, Math.round(diff));
}

function formatCurrency(value: number | string) {
  const n = Number(value) || 0;
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}
