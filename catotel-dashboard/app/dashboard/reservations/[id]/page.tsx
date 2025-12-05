"use client";

import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
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
  Plus,
  PawPrint,
  Trash2,
  User,
  X,
  XCircle,
} from "lucide-react";
import { HotelApi } from "@/lib/api/hotel";
import type { CheckInForm, CheckOutForm, Reservation } from "@/types/hotel";
import { ReservationStatus } from "@/types/enums";

export default function ReservationDetailPage() {
  const params = useParams<{ id: string }>();
  const reservationId = params?.id;
  const queryClient = useQueryClient();

  const { data: reservation, isLoading, error } = useQuery({
    queryKey: ["reservation", reservationId],
    enabled: Boolean(reservationId),
    queryFn: () => HotelApi.getReservation(reservationId!),
  });

  const updateMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      HotelApi.updateReservation(reservationId!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservation", reservationId] });
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
    },
    onError: (err) => {
      console.error(err);
      alert("Durum güncellenirken bir hata oluştu.");
    },
  });

  const [showCheckInForm, setShowCheckInForm] = useState(false);
  const [showCheckOutForm, setShowCheckOutForm] = useState(false);

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

  const totalExtras = reservation.services?.reduce((sum, s) => sum + Number(s.unitPrice) * s.quantity, 0) ? 0;
  const nights = calculateNights(reservation.checkIn, reservation.checkOut);

  const handleStatusChange = (status: ReservationStatus) => updateMutation.mutate({ status });

  const handleCheckInSubmit = async (form: CheckInForm) => {
    try {
      await updateMutation.mutateAsync({
        status: ReservationStatus.CHECKED_IN,
        checkInForm: form,
      });
      setShowCheckInForm(false);
    } catch (err) {
      // Hata mesaj? mutation i?inde g?steriliyor.
      console.error(err);
    }
  };

  const handleCheckOutSubmit = async (form: CheckOutForm) => {
    try {
      await updateMutation.mutateAsync({
        status: ReservationStatus.CHECKED_OUT,
        checkOutForm: form,
      });
      setShowCheckOutForm(false);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <HeaderCard
        reservation={reservation}
        nights={nights}
        onCancel={() => handleStatusChange(ReservationStatus.CANCELLED)}
        isUpdating={updateMutation.isPending}
      />

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="space-y-4">
          <InfoCard reservation={reservation} />
          <StayCard reservation={reservation} nights={nights} />
          <ExtrasCard reservation={reservation} totalExtras={totalExtras} />
          <NotesCard reservation={reservation} />
        </div>
        <div className="space-y-4">
          <TimelineCard trail={trail} />
          <OperationsCard
            reservation={reservation}
            onStatusChange={handleStatusChange}
            onOpenCheckInForm={() => setShowCheckInForm(true)}
            onOpenCheckOutForm={() => setShowCheckOutForm(true)}
            isUpdating={updateMutation.isPending}
          />
          <PaymentCard reservation={reservation} totalExtras={totalExtras} />
        </div>
      </div>

      <TabsSection />

      <CheckInFormModal
        open={showCheckInForm}
        onClose={() => setShowCheckInForm(false)}
        onSubmit={handleCheckInSubmit}
        reservation={reservation}
        saving={updateMutation.isPending}
      />
      <CheckOutFormModal
        open={showCheckOutForm}
        onClose={() => setShowCheckOutForm(false)}
        onSubmit={handleCheckOutSubmit}
        reservation={reservation}
        saving={updateMutation.isPending}
      />
    </div>
  );
}

function HeaderCard({ reservation, nights, onCancel, isUpdating }: { reservation: Reservation; nights: number; onCancel: () => void; isUpdating: boolean }) {
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
            Müşteri: {reservation.customer?.user.name ? "Bilinmiyor"} • Kedi: {primaryCat?.name ? "?"}{" "}
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
        <Link
          href={`/dashboard/reservations/${reservation.id}/edit`}
          className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold text-[var(--admin-text-strong)] transition hover:-translate-y-0.5 hover:border-peach-300 hover:text-peach-500 admin-border"
        >
          <Edit3 className="h-4 w-4" aria-hidden />
          Düzenle
        </Link>
        <button
          type="button"
          onClick={onCancel}
          disabled={isUpdating}
          className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold text-red-500 transition hover:-translate-y-0.5 hover:border-red-300 admin-border disabled:cursor-not-allowed disabled:opacity-60"
        >
          <XCircle className="h-4 w-4" aria-hidden />
          {isUpdating ? "İptal ediliyor..." : "İptal Et"}
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
            <p className="text-base font-semibold">{reservation.customer?.user.name ? "Bilinmiyor"}</p>
            <p className="text-xs text-[var(--admin-muted)]">
              {reservation.customer?.user.email ? "E-posta yok"} • {reservation.customer?.user.name ? "" : ""}
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
              <p className="text-xs text-[var(--admin-muted)]">{catEntry.cat.breed ? "Cins bilinmiyor"}</p>
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
        <Link
          href={`/dashboard/reservations/${reservation.id}/edit?step=dates`}
          className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold text-[var(--admin-text-strong)] transition hover:-translate-y-0.5 hover:border-peach-300 hover:text-peach-500 admin-border"
        >
          <DoorOpen className="h-4 w-4" aria-hidden />
          Oda değiştir
        </Link>
      }
    >
      <div className="grid gap-3 md:grid-cols-2">
        <div className="flex items-center gap-2 rounded-2xl bg-[var(--admin-surface-alt)] px-3 py-3">
          <Home className="h-4 w-4 text-peach-400" aria-hidden />
          <div>
            <p className="text-sm font-semibold">
              {reservation.roomType.name} (kapasite: {reservation.roomType.capacity} kedi)
            </p>
            <p className="text-xs text-[var(--admin-muted)]">{reservation.roomType.description ? "Oda detayi"}</p>
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
        <Link
          href={`/dashboard/reservations/${reservation.id}/edit?step=pricing`}
          className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold text-[var(--admin-text-strong)] transition hover:-translate-y-0.5 hover:border-peach-300 hover:text-peach-500 admin-border"
        >
          <NotebookPen className="h-4 w-4" aria-hidden />
          Notları düzenle
        </Link>
      }
    >
      <div className="space-y-2 rounded-2xl bg-[var(--admin-surface-alt)] p-3">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--admin-muted)]">Müşteri notu</p>
        <p className="text-sm leading-relaxed text-[var(--admin-text-strong)]">
          {reservation.specialRequests ? "Not yok"}
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

function OperationsCard({
  reservation,
  onStatusChange,
  onOpenCheckInForm,
  onOpenCheckOutForm,
  isUpdating,
}: {
  reservation: Reservation;
  onStatusChange: (status: ReservationStatus) => void;
  onOpenCheckInForm: () => void;
  onOpenCheckOutForm: () => void;
  isUpdating: boolean;
}) {
  const isCancelled = reservation.status === ReservationStatus.CANCELLED;
  const isConfirmed = reservation.status === ReservationStatus.CONFIRMED;
  const isCheckedIn = reservation.status === ReservationStatus.CHECKED_IN;
  const isCheckedOut = reservation.status === ReservationStatus.CHECKED_OUT;
  const canConfirm = reservation.status === ReservationStatus.PENDING;
  const canCheckIn =
    reservation.status === ReservationStatus.CONFIRMED ||
    reservation.status === ReservationStatus.CHECKED_IN;
  const canCheckOut =
    reservation.status === ReservationStatus.CHECKED_IN ||
    reservation.status === ReservationStatus.CHECKED_OUT;
  const canCancel =
    reservation.status !== ReservationStatus.CANCELLED &&
    reservation.status !== ReservationStatus.CHECKED_OUT;

  return (
    <CardShell title="Operasyon">
      <div className="grid gap-3 sm:grid-cols-2">
        {!isCancelled && (
          <>
            <button
              type="button"
              onClick={() =>
                onStatusChange(isConfirmed ? ReservationStatus.PENDING : ReservationStatus.CONFIRMED)
              }
              disabled={!(canConfirm || isConfirmed) || isUpdating}
              className={clsx(
                "flex items-center justify-center gap-2 rounded-2xl bg-peach-500 px-4 py-3 text-sm font-semibold text-white shadow transition hover:-translate-y-0.5 hover:shadow-lg",
                (!(canConfirm || isConfirmed) || isUpdating) &&
                  "opacity-60 hover:translate-y-0 hover:shadow-none"
              )}
            >
              <Check className="h-4 w-4" aria-hidden />
              {isUpdating
                ? isConfirmed
                  ? "Onay geri alınıyor..."
                  : "Onaylanıyor..."
                : isConfirmed
                  ? "Onayı Geri Al"
                  : "Rezervasyonu Onayla"}
            </button>
            <button
              type="button"
              onClick={() => {
                if (isCheckedIn) {
                  onStatusChange(ReservationStatus.CONFIRMED);
                } else {
                  onOpenCheckInForm();
                }
              }}
              disabled={!canCheckIn || isUpdating}
              className={clsx(
                "flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white shadow transition hover:-translate-y-0.5 hover:shadow-lg",
                (!canCheckIn || isUpdating) && "opacity-60 hover:translate-y-0 hover:shadow-none"
              )}
            >
              <CheckCircle2 className="h-4 w-4" aria-hidden />
              {isUpdating
                ? "İşlem yapılıyor..."
                : isCheckedIn
                  ? "Check-in Geri Al (Onaya dön)"
                  : "Check-in Yap"}
            </button>
            <button
              type="button"
              onClick={() => {
                if (isCheckedOut) {
                  onStatusChange(ReservationStatus.CHECKED_IN);
                } else {
                  onOpenCheckOutForm();
                }
              }}
              disabled={!canCheckOut || isUpdating}
              className={clsx(
                "flex items-center justify-center gap-2 rounded-2xl bg-peach-400 px-4 py-3 text-sm font-semibold text-white shadow transition hover:-translate-y-0.5 hover:shadow-lg",
                (!canCheckOut || isUpdating) && "opacity-60 hover:translate-y-0 hover:shadow-none"
              )}
            >
              <DoorOpen className="h-4 w-4" aria-hidden />
              {isUpdating
                ? "İşlem yapılıyor..."
                : isCheckedOut
                  ? "Check-out Geri Al"
                  : "Check-out Yap"}
            </button>
          </>
        )}
        {isCancelled && (
          <button
            type="button"
            onClick={() => onStatusChange(ReservationStatus.CONFIRMED)}
            disabled={isUpdating}
            className={clsx(
              "flex items-center justify-center gap-2 rounded-2xl bg-[var(--admin-highlight-muted)] px-4 py-3 text-sm font-semibold text-[var(--admin-text-strong)] shadow transition hover:-translate-y-0.5 hover:shadow-lg",
              isUpdating && "opacity-60 hover:translate-y-0 hover:shadow-none"
            )}
          >
            <CheckCircle2 className="h-4 w-4" aria-hidden />
            {isUpdating ? "Geri alınıyor..." : "İptali Geri Al (Onayla)"}
          </button>
        )}
      </div>
      {!isCancelled && (
        <div className="mt-3 rounded-2xl bg-[var(--admin-surface-alt)] px-4 py-3 text-sm">
          <button
            type="button"
            onClick={() => onStatusChange(ReservationStatus.CANCELLED)}
            disabled={!canCancel || isUpdating}
            className={clsx(
              "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold text-red-500 transition hover:-translate-y-0.5 hover:border-red-200 hover:text-red-600 admin-border",
              (!canCancel || isUpdating) && "opacity-60 hover:translate-y-0"
            )}
          >
            <XCircle className="h-4 w-4" aria-hidden />
            {isUpdating ? "İşlem yapılıyor..." : "İptal Et"}
          </button>
        </div>
      )}

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <div className="space-y-1 rounded-2xl border bg-[var(--admin-surface-alt)] px-4 py-3 text-sm admin-border">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] admin-muted">Check-in Kaydi</p>
          <p className="text-sm font-semibold text-[var(--admin-text-strong)]">
            {reservation.checkInForm?.arrivalTime
              ? `${formatDateTime(reservation.checkInForm.arrivalTime)} - ${reservation.checkInForm?.deliveredItems?.length ? 0} esya`
              : "Henuz kaydedilmedi"}
          </p>
          {reservation.checkInForm?.catCondition && (
            <p className="text-xs admin-muted">Not: {reservation.checkInForm.catCondition}</p>
          )}
        </div>
        <div className="space-y-1 rounded-2xl border bg-[var(--admin-surface-alt)] px-4 py-3 text-sm admin-border">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] admin-muted">Check-out Kaydi</p>
          <p className="text-sm font-semibold text-[var(--admin-text-strong)]">
            {reservation.checkOutForm?.departureTime
              ? `${formatDateTime(reservation.checkOutForm.departureTime)} - ${reservation.checkOutForm?.returnedItems?.length ? 0} esya`
              : "Henuz kaydedilmedi"}
          </p>
          {reservation.checkOutForm?.catCondition && (
            <p className="text-xs admin-muted">Not: {reservation.checkOutForm.catCondition}</p>
          )}
        </div>
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

type ItemField = {
  label: string;
  quantity?: string;
  note?: string;
};

type MedicationField = {
  name: string;
  dosage?: string;
  schedule?: string;
  withFood: boolean;
  notes?: string;
};

function CheckInFormModal({
  open,
  onClose,
  onSubmit,
  reservation,
  saving,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (form: CheckInForm) => Promise<void>;
  reservation: Reservation;
  saving: boolean;
}) {
  const [arrivalTime, setArrivalTime] = useState("");
  const [deliveredItems, setDeliveredItems] = useState<ItemField[]>([]);
  const [foodPlan, setFoodPlan] = useState({
    brand: "",
    amountPerMeal: "",
    frequencyPerDay: "",
    instructions: "",
  });
  const [medications, setMedications] = useState<MedicationField[]>([]);
  const [weightKg, setWeightKg] = useState("");
  const [catCondition, setCatCondition] = useState("");
  const [hasVaccineCard, setHasVaccineCard] = useState(false);
  const [hasFleaTreatment, setHasFleaTreatment] = useState(false);
  const [handledBy, setHandledBy] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setArrivalTime(
      toDatetimeLocal(
        reservation.checkInForm?.arrivalTime ?
          reservation.checkedInAt ?
          reservation.checkIn
      )
    );
    setDeliveredItems(
      reservation.checkInForm?.deliveredItems?.map((item) => ({
        label: item.label,
        quantity: item.quantity ? String(item.quantity) : "",
        note: item.note ? "",
      })) ? []
    );
    setFoodPlan({
      brand: reservation.checkInForm?.foodPlan?.brand ? "",
      amountPerMeal: reservation.checkInForm?.foodPlan?.amountPerMeal ? "",
      frequencyPerDay: reservation.checkInForm?.foodPlan?.frequencyPerDay
        ? String(reservation.checkInForm?.foodPlan?.frequencyPerDay)
        : "",
      instructions:
        reservation.checkInForm?.foodPlan?.instructions ?
        reservation.specialRequests ?
        "",
    });
    setMedications(
      reservation.checkInForm?.medicationPlan?.map((med) => ({
        name: med.name,
        dosage: med.dosage ? "",
        schedule: med.schedule ? "",
        withFood: Boolean(med.withFood),
        notes: med.notes ? "",
      })) ? []
    );
    setWeightKg(
      reservation.checkInForm?.weightKg ? String(reservation.checkInForm.weightKg) : ""
    );
    setCatCondition(reservation.checkInForm?.catCondition ? "");
    setHasVaccineCard(Boolean(reservation.checkInForm?.hasVaccineCard));
    setHasFleaTreatment(Boolean(reservation.checkInForm?.hasFleaTreatment));
    setHandledBy(reservation.checkInForm?.handledBy ? "");
    setAdditionalNotes(reservation.checkInForm?.additionalNotes ? "");
    setError(null);
  }, [open, reservation]);

  if (!open) return null;

  const handleSubmit = async () => {
    const normalizedItems =
      deliveredItems
        .map((item) => ({
          label: item.label.trim(),
          quantity: item.quantity ? Number(item.quantity) : undefined,
          note: trimOrUndefined(item.note),
        }))
        .filter((item) => item.label.length > 0) ? [];

    if (!arrivalTime) {
      setError("Check-in saati girmelisin.");
      return;
    }
    if (!normalizedItems.length) {
      setError("Teslim edilen eÅŸyalarÄ± eklemelisin.");
      return;
    }

    const normalizedFoodPlan =
      foodPlan.brand ||
      foodPlan.amountPerMeal ||
      foodPlan.frequencyPerDay ||
      foodPlan.instructions
        ? {
            brand: trimOrUndefined(foodPlan.brand),
            amountPerMeal: trimOrUndefined(foodPlan.amountPerMeal),
            frequencyPerDay: normalizeNumber(foodPlan.frequencyPerDay),
            instructions: trimOrUndefined(foodPlan.instructions),
          }
        : undefined;

    const normalizedMedications = medications
      .map((med) => ({
        name: med.name.trim(),
        dosage: trimOrUndefined(med.dosage),
        schedule: trimOrUndefined(med.schedule),
        withFood: med.withFood,
        notes: trimOrUndefined(med.notes),
      }))
      .filter((med) => med.name.length > 0);

    const payload: CheckInForm = {
      arrivalTime: new Date(arrivalTime).toISOString(),
      deliveredItems: normalizedItems,
      foodPlan: normalizedFoodPlan,
      medicationPlan: normalizedMedications.length ? normalizedMedications : undefined,
      weightKg: normalizeNumber(weightKg),
      catCondition: trimOrUndefined(catCondition),
      hasVaccineCard,
      hasFleaTreatment,
      handledBy: trimOrUndefined(handledBy),
      additionalNotes: trimOrUndefined(additionalNotes),
    };

    setError(null);
    await onSubmit(payload);
  };

  return (
    <ModalShell
      title="Check-in formu"
      description="Geli?te teslim al?nan e?yalar?, saati ve klinik/g?venlik kontrollerini kaydet."
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold text-[var(--admin-text-strong)] transition hover:-translate-y-0.5 hover:border-peach-300 hover:text-peach-500 admin-border"
            disabled={saving}
          >
            Vazge?
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className={clsx(
              "inline-flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white shadow-glow transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70",
            )}
          >
            {saving ? "Kaydediliyor..." : "Check-in'i Tamamla"}
          </button>
        </>
      }
    >
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-[var(--admin-text-strong)]">Check-in saati</label>
          <input
            type="datetime-local"
            value={arrivalTime}
            onChange={(e) => setArrivalTime(e.target.value)}
            className="w-full rounded-xl border bg-[var(--admin-surface-alt)] px-3 py-2 text-sm text-[var(--admin-text-strong)] focus:outline-none focus:ring-2 focus:ring-peach-300 admin-border"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-[var(--admin-text-strong)]">Teslim an? g?zlemleri</label>
          <textarea
            value={catCondition}
            onChange={(e) => setCatCondition(e.target.value)}
            rows={3}
            placeholder="DuruÅŸ, yara, davranÄ±ÅŸ, tÄ±rmalama bilgisi..."
            className="w-full rounded-xl border bg-[var(--admin-surface-alt)] px-3 py-2 text-sm text-[var(--admin-text-strong)] placeholder:text-[var(--admin-muted)] focus:outline-none focus:ring-2 focus:ring-peach-300 admin-border"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              min="0"
              step="0.1"
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              placeholder="Kilo (kg)"
              className="rounded-xl border bg-[var(--admin-surface-alt)] px-3 py-2 text-sm text-[var(--admin-text-strong)] placeholder:text-[var(--admin-muted)] focus:outline-none focus:ring-2 focus:ring-peach-300 admin-border"
            />
            <input
              type="text"
              value={handledBy}
              onChange={(e) => setHandledBy(e.target.value)}
              placeholder="Teslim alan ekip"
              className="rounded-xl border bg-[var(--admin-surface-alt)] px-3 py-2 text-sm text-[var(--admin-text-strong)] placeholder:text-[var(--admin-muted)] focus:outline-none focus:ring-2 focus:ring-peach-300 admin-border"
            />
          </div>
        </div>
      </div>

      <EditableItemList
        title="Teslim edilen eÅŸyalar"
        items={deliveredItems}
        onChange={setDeliveredItems}
        addLabel="EÅŸya ekle"
        placeholder="Ta??ma kutusu, mama, ila?..."
      />

      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-3 rounded-2xl border bg-[var(--admin-surface-alt)] p-3 admin-border">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Beslenme planÄ±</p>
            <span className="text-[10px] font-semibold uppercase tracking-[0.3em] admin-muted">G?nl?k rutin</span>
          </div>
          <input
            type="text"
            value={foodPlan.brand}
            onChange={(e) => setFoodPlan((prev) => ({ ...prev, brand: e.target.value }))}
            placeholder="Mama markasÄ± / tipi"
            className="rounded-xl border bg-[var(--admin-surface)] px-3 py-2 text-sm text-[var(--admin-text-strong)] placeholder:text-[var(--admin-muted)] focus:outline-none focus:ring-2 focus:ring-peach-300 admin-border"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              value={foodPlan.amountPerMeal}
              onChange={(e) => setFoodPlan((prev) => ({ ...prev, amountPerMeal: e.target.value }))}
              placeholder="???n ba?? miktar"
              className="rounded-xl border bg-[var(--admin-surface)] px-3 py-2 text-sm text-[var(--admin-text-strong)] placeholder:text-[var(--admin-muted)] focus:outline-none focus:ring-2 focus:ring-peach-300 admin-border"
            />
            <input
              type="number"
              min="1"
              value={foodPlan.frequencyPerDay}
              onChange={(e) => setFoodPlan((prev) => ({ ...prev, frequencyPerDay: e.target.value }))}
              placeholder="G?nde ka? ???n"
              className="rounded-xl border bg-[var(--admin-surface)] px-3 py-2 text-sm text-[var(--admin-text-strong)] placeholder:text-[var(--admin-muted)] focus:outline-none focus:ring-2 focus:ring-peach-300 admin-border"
            />
          </div>
          <textarea
            value={foodPlan.instructions}
            onChange={(e) => setFoodPlan((prev) => ({ ...prev, instructions: e.target.value }))}
            rows={3}
            placeholder="Islak mama, oda sÄ±caklÄ±ÄŸÄ±, alerji notu vb."
            className="w-full rounded-xl border bg-[var(--admin-surface)] px-3 py-2 text-sm text-[var(--admin-text-strong)] placeholder:text-[var(--admin-muted)] focus:outline-none focus:ring-2 focus:ring-peach-300 admin-border"
          />
        </div>
        <MedicationListEditor medications={medications} onChange={setMedications} />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2 rounded-2xl border bg-[var(--admin-surface-alt)] p-3 admin-border">
          <p className="text-sm font-semibold">Sa?l?k / g?venlik</p>
          <label className="flex items-center gap-2 text-sm font-semibold text-[var(--admin-text-strong)]">
            <input
              type="checkbox"
              checked={hasVaccineCard}
              onChange={(e) => setHasVaccineCard(e.target.checked)}
              className="h-4 w-4 rounded border-[var(--admin-border)] text-peach-500 focus:ring-peach-300"
            />
            A?? karnesi / g?ncellemeler teslim al?nd?
          </label>
          <label className="flex items-center gap-2 text-sm font-semibold text-[var(--admin-text-strong)]">
            <input
              type="checkbox"
              checked={hasFleaTreatment}
              onChange={(e) => setHasFleaTreatment(e.target.checked)}
              className="h-4 w-4 rounded border-[var(--admin-border)] text-peach-500 focus:ring-peach-300"
            />
            Pire/ak?t?lma kontrol? yap?ld?
          </label>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-[var(--admin-text-strong)]">Ek not</label>
          <textarea
            value={additionalNotes}
            onChange={(e) => setAdditionalNotes(e.target.value)}
            rows={4}
            placeholder="Operasyon veya aile talebi..."
            className="w-full rounded-xl border bg-[var(--admin-surface-alt)] px-3 py-2 text-sm text-[var(--admin-text-strong)] placeholder:text-[var(--admin-muted)] focus:outline-none focus:ring-2 focus:ring-peach-300 admin-border"
          />
        </div>
      </div>

      {error && <p className="text-sm font-semibold text-red-500">{error}</p>}
    </ModalShell>
  );
}

function CheckOutFormModal({
  open,
  onClose,
  onSubmit,
  reservation,
  saving,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (form: CheckOutForm) => Promise<void>;
  reservation: Reservation;
  saving: boolean;
}) {
  const [departureTime, setDepartureTime] = useState("");
  const [returnedItems, setReturnedItems] = useState<ItemField[]>([]);
  const [catCondition, setCatCondition] = useState("");
  const [incidents, setIncidents] = useState("");
  const [roomConditionNote, setRoomConditionNote] = useState("");
  const [remainingFood, setRemainingFood] = useState("");
  const [nextVisitNote, setNextVisitNote] = useState("");
  const [handledBy, setHandledBy] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setDepartureTime(
      toDatetimeLocal(
        reservation.checkOutForm?.departureTime ?
          reservation.checkedOutAt ?
          reservation.checkOut
      )
    );
    setReturnedItems(
      reservation.checkOutForm?.returnedItems?.map((item) => ({
        label: item.label,
        quantity: item.quantity ? String(item.quantity) : "",
        note: item.note ? "",
      })) ? []
    );
    setCatCondition(reservation.checkOutForm?.catCondition ? "");
    setIncidents(reservation.checkOutForm?.incidents ? "");
    setRoomConditionNote(reservation.checkOutForm?.roomConditionNote ? "");
    setRemainingFood(reservation.checkOutForm?.remainingFood ? "");
    setNextVisitNote(reservation.checkOutForm?.nextVisitNote ? "");
    setHandledBy(reservation.checkOutForm?.handledBy ? "");
    setAdditionalNotes(reservation.checkOutForm?.additionalNotes ? "");
    setError(null);
  }, [open, reservation]);

  if (!open) return null;

  const handleSubmit = async () => {
    const normalizedItems =
      returnedItems
        .map((item) => ({
          label: item.label.trim(),
          quantity: item.quantity ? Number(item.quantity) : undefined,
          note: trimOrUndefined(item.note),
        }))
        .filter((item) => item.label.length > 0) ? [];

    if (!departureTime) {
      setError("Check-out saati girmelisin.");
      return;
    }
    if (!normalizedItems.length) {
      setError("Geri teslim edilen eÅŸyalarÄ± eklemelisin.");
      return;
    }
    if (!catCondition.trim()) {
      setError("??k?? durumunu yazmal?s?n.");
      return;
    }

    const payload: CheckOutForm = {
      departureTime: new Date(departureTime).toISOString(),
      returnedItems: normalizedItems,
      catCondition: trimOrUndefined(catCondition),
      incidents: trimOrUndefined(incidents),
      roomConditionNote: trimOrUndefined(roomConditionNote),
      remainingFood: trimOrUndefined(remainingFood),
      nextVisitNote: trimOrUndefined(nextVisitNote),
      handledBy: trimOrUndefined(handledBy),
      additionalNotes: trimOrUndefined(additionalNotes),
    };

    setError(null);
    await onSubmit(payload);
  };

  return (
    <ModalShell
      title="Check-out formu"
      description="??k?? saati, teslim edilen e?yalar ve ??k??taki durum g?zlemlerini kaydet."
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold text-[var(--admin-text-strong)] transition hover:-translate-y-0.5 hover:border-peach-300 hover:text-peach-500 admin-border"
            disabled={saving}
          >
            Vazge?
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-full bg-peach-500 px-5 py-2.5 text-sm font-semibold text-white shadow-glow transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {saving ? "Kaydediliyor..." : "Check-out'u Tamamla"}
          </button>
        </>
      }
    >
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-[var(--admin-text-strong)]">Check-out saati</label>
          <input
            type="datetime-local"
            value={departureTime}
            onChange={(e) => setDepartureTime(e.target.value)}
            className="w-full rounded-xl border bg-[var(--admin-surface-alt)] px-3 py-2 text-sm text-[var(--admin-text-strong)] focus:outline-none focus:ring-2 focus:ring-peach-300 admin-border"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-[var(--admin-text-strong)]">??k?? g?zlemi</label>
          <textarea
            value={catCondition}
            onChange={(e) => setCatCondition(e.target.value)}
            rows={3}
            placeholder="Teslim an?nda davran??, t?y durumu, yara kontrol?..."
            className="w-full rounded-xl border bg-[var(--admin-surface-alt)] px-3 py-2 text-sm text-[var(--admin-text-strong)] placeholder:text-[var(--admin-muted)] focus:outline-none focus:ring-2 focus:ring-peach-300 admin-border"
          />
        </div>
      </div>

      <EditableItemList
        title="Geri teslim edilen eÅŸyalar"
        items={returnedItems}
        onChange={setReturnedItems}
        addLabel="EÅŸya ekle"
        placeholder="Ta??ma kutusu, mama, ila?..."
      />

      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2 rounded-2xl border bg-[var(--admin-surface-alt)] p-3 admin-border">
          <p className="text-sm font-semibold">Temizlik & hasar</p>
          <textarea
            value={roomConditionNote}
            onChange={(e) => setRoomConditionNote(e.target.value)}
            rows={3}
            placeholder="Oda durumu, temizlik ihtiyacÄ±, hasar vb."
            className="w-full rounded-2xl border bg-[var(--admin-surface)] px-3 py-2 text-sm text-[var(--admin-text-strong)] placeholder:text-[var(--admin-muted)] focus:outline-none focus:ring-2 focus:ring-peach-300 admin-border"
          />
          <textarea
            value={incidents}
            onChange={(e) => setIncidents(e.target.value)}
            rows={3}
            placeholder="Olay, rapor veya bilgilendirme"
            className="w-full rounded-2xl border bg-[var(--admin-surface)] px-3 py-2 text-sm text-[var(--admin-text-strong)] placeholder:text-[var(--admin-muted)] focus:outline-none focus:ring-2 focus:ring-peach-300 admin-border"
          />
        </div>
        <div className="space-y-2 rounded-2xl border bg-[var(--admin-surface-alt)] p-3 admin-border">
          <p className="text-sm font-semibold">KapanÄ±ÅŸ notlarÄ±</p>
          <input
            type="text"
            value={remainingFood}
            onChange={(e) => setRemainingFood(e.target.value)}
            placeholder="Kalan mama / ila? bilgisi"
            className="rounded-2xl border bg-[var(--admin-surface)] px-3 py-2 text-sm text-[var(--admin-text-strong)] placeholder:text-[var(--admin-muted)] focus:outline-none focus:ring-2 focus:ring-peach-300 admin-border"
          />
          <input
            type="text"
            value={nextVisitNote}
            onChange={(e) => setNextVisitNote(e.target.value)}
            placeholder="Takip / sonraki ziyarete hatÄ±rlatma"
            className="rounded-2xl border bg-[var(--admin-surface)] px-3 py-2 text-sm text-[var(--admin-text-strong)] placeholder:text-[var(--admin-muted)] focus:outline-none focus:ring-2 focus:ring-peach-300 admin-border"
          />
          <input
            type="text"
            value={handledBy}
            onChange={(e) => setHandledBy(e.target.value)}
            placeholder="Teslim eden ekip"
            className="rounded-2xl border bg-[var(--admin-surface)] px-3 py-2 text-sm text-[var(--admin-text-strong)] placeholder:text-[var(--admin-muted)] focus:outline-none focus:ring-2 focus:ring-peach-300 admin-border"
          />
          <textarea
            value={additionalNotes}
            onChange={(e) => setAdditionalNotes(e.target.value)}
            rows={3}
            placeholder="M??teri ile payla??lacak mesaj / i? not"
            className="w-full rounded-2xl border bg-[var(--admin-surface)] px-3 py-2 text-sm text-[var(--admin-text-strong)] placeholder:text-[var(--admin-muted)] focus:outline-none focus:ring-2 focus:ring-peach-300 admin-border"
          />
        </div>
      </div>

      {error && <p className="text-sm font-semibold text-red-500">{error}</p>}
    </ModalShell>
  );
}

function ModalShell({
  title,
  description,
  onClose,
  children,
  footer,
}: {
  title: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-4xl rounded-2xl border bg-[var(--admin-surface)] p-6 shadow-2xl admin-border">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] admin-muted">Operasyon</p>
            <h3 className="text-xl font-semibold text-[var(--admin-text-strong)]">{title}</h3>
            {description && <p className="text-sm admin-muted">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border bg-[var(--admin-surface-alt)] p-2 text-[var(--admin-muted)] transition hover:-translate-y-0.5 hover:border-peach-300 hover:text-peach-500 admin-border"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
        <div className="mt-4 max-h-[70vh] space-y-4 overflow-y-auto pr-1">{children}</div>
        {footer && <div className="mt-5 flex flex-wrap justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}

function EditableItemList({
  title,
  items,
  onChange,
  addLabel,
  placeholder,
}: {
  title: string;
  items: ItemField[];
  onChange: (next: ItemField[]) => void;
  addLabel: string;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState<ItemField>({ label: "", quantity: "", note: "" });

  const handleAdd = () => {
    if (!draft.label.trim()) return;
    onChange([
      ...items,
      {
        label: draft.label.trim(),
        quantity: draft.quantity?.trim() ? "",
        note: draft.note?.trim() ? "",
      },
    ]);
    setDraft({ label: "", quantity: "", note: "" });
  };

  const handleRemove = (index: number) => {
    onChange(items.filter((_, idx) => idx !== index));
  };

  return (
    <div className="space-y-2 rounded-2xl border bg-[var(--admin-surface-alt)] p-3 admin-border">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">{title}</p>
        <button
          type="button"
          onClick={handleAdd}
          className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold text-[var(--admin-text-strong)] transition hover:-translate-y-0.5 hover:border-peach-300 hover:text-peach-500 admin-border"
        >
          <Plus className="h-4 w-4" aria-hidden />
          {addLabel}
        </button>
      </div>
      <div className="grid gap-2 sm:grid-cols-[2fr_1fr_1.3fr]">
        <input
          type="text"
          value={draft.label}
          onChange={(e) => setDraft((prev) => ({ ...prev, label: e.target.value }))}
          placeholder={placeholder ? "EÅŸya"}
          className="rounded-xl border bg-[var(--admin-surface)] px-3 py-2 text-sm text-[var(--admin-text-strong)] placeholder:text-[var(--admin-muted)] focus:outline-none focus:ring-2 focus:ring-peach-300 admin-border"
        />
        <input
          type="number"
          min="0"
          value={draft.quantity}
          onChange={(e) => setDraft((prev) => ({ ...prev, quantity: e.target.value }))}
          placeholder="Adet"
          className="rounded-xl border bg-[var(--admin-surface)] px-3 py-2 text-sm text-[var(--admin-text-strong)] placeholder:text-[var(--admin-muted)] focus:outline-none focus:ring-2 focus:ring-peach-300 admin-border"
        />
        <div className="flex gap-2">
          <input
            type="text"
            value={draft.note}
            onChange={(e) => setDraft((prev) => ({ ...prev, note: e.target.value }))}
            placeholder="Not"
            className="w-full rounded-xl border bg-[var(--admin-surface)] px-3 py-2 text-sm text-[var(--admin-text-strong)] placeholder:text-[var(--admin-muted)] focus:outline-none focus:ring-2 focus:ring-peach-300 admin-border"
          />
          <button
            type="button"
            onClick={handleAdd}
            className="inline-flex items-center justify-center rounded-xl border bg-[var(--admin-surface)] p-2 text-[var(--admin-muted)] transition hover:-translate-y-0.5 hover:border-peach-300 hover:text-peach-500 admin-border"
            aria-label={addLabel}
          >
            <Plus className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {items.length === 0 && <span className="text-xs font-semibold text-[var(--admin-muted)]">Hen?z ekleme yok.</span>}
        {items.map((item, idx) => (
          <span
            key={`${item.label}-${idx}`}
            className="inline-flex items-center gap-2 rounded-full border bg-[var(--admin-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--admin-text-strong)] admin-border"
          >
            <span>{item.label}</span>
            {item.quantity && <span className="text-[var(--admin-muted)]">x{item.quantity}</span>}
            {item.note && <span className="text-[var(--admin-muted)]">{item.note}</span>}
            <button
              type="button"
              onClick={() => handleRemove(idx)}
              className="rounded-full p-1 text-[var(--admin-muted)] transition hover:text-red-500"
              aria-label="Sil"
            >
              <Trash2 className="h-4 w-4" aria-hidden />
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}

function MedicationListEditor({
  medications,
  onChange,
}: {
  medications: MedicationField[];
  onChange: (next: MedicationField[]) => void;
}) {
  const [draft, setDraft] = useState<MedicationField>({
    name: "",
    dosage: "",
    schedule: "",
    withFood: false,
    notes: "",
  });

  const handleAdd = () => {
    if (!draft.name.trim()) return;
    onChange([
      ...medications,
      {
        name: draft.name.trim(),
        dosage: draft.dosage?.trim(),
        schedule: draft.schedule?.trim(),
        withFood: draft.withFood,
        notes: draft.notes?.trim(),
      },
    ]);
    setDraft({ name: "", dosage: "", schedule: "", withFood: false, notes: "" });
  };

  const handleRemove = (index: number) => {
    onChange(medications.filter((_, idx) => idx !== index));
  };

  return (
    <div className="space-y-2 rounded-2xl border bg-[var(--admin-surface-alt)] p-3 admin-border">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">?la? / takviye plan?</p>
        <button
          type="button"
          onClick={handleAdd}
          className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold text-[var(--admin-text-strong)] transition hover:-translate-y-0.5 hover:border-peach-300 hover:text-peach-500 admin-border"
        >
          <Plus className="h-4 w-4" aria-hidden />
          Ekle
        </button>
      </div>
      <div className="grid gap-2 sm:grid-cols-[2fr_1fr]">
        <input
          type="text"
          value={draft.name}
          onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))}
          placeholder="?la? / takviye ad?"
          className="rounded-xl border bg-[var(--admin-surface)] px-3 py-2 text-sm text-[var(--admin-text-strong)] placeholder:text-[var(--admin-muted)] focus:outline-none focus:ring-2 focus:ring-peach-300 admin-border"
        />
        <input
          type="text"
          value={draft.dosage}
          onChange={(e) => setDraft((prev) => ({ ...prev, dosage: e.target.value }))}
          placeholder="Doz"
          className="rounded-xl border bg-[var(--admin-surface)] px-3 py-2 text-sm text-[var(--admin-text-strong)] placeholder:text-[var(--admin-muted)] focus:outline-none focus:ring-2 focus:ring-peach-300 admin-border"
        />
      </div>
      <div className="grid gap-2 sm:grid-cols-[2fr_1fr]">
        <input
          type="text"
          value={draft.schedule}
          onChange={(e) => setDraft((prev) => ({ ...prev, schedule: e.target.value }))}
          placeholder="Saat / periyot"
          className="rounded-xl border bg-[var(--admin-surface)] px-3 py-2 text-sm text-[var(--admin-text-strong)] placeholder:text-[var(--admin-muted)] focus:outline-none focus:ring-2 focus:ring-peach-300 admin-border"
        />
        <label className="flex items-center gap-2 text-xs font-semibold text-[var(--admin-text-strong)]">
          <input
            type="checkbox"
            checked={draft.withFood}
            onChange={(e) => setDraft((prev) => ({ ...prev, withFood: e.target.checked }))}
            className="h-4 w-4 rounded border-[var(--admin-border)] text-peach-500 focus:ring-peach-300"
          />
          Yemekten sonra
        </label>
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={draft.notes}
          onChange={(e) => setDraft((prev) => ({ ...prev, notes: e.target.value }))}
          placeholder="Not"
          className="w-full rounded-xl border bg-[var(--admin-surface)] px-3 py-2 text-sm text-[var(--admin-text-strong)] placeholder:text-[var(--admin-muted)] focus:outline-none focus:ring-2 focus:ring-peach-300 admin-border"
        />
        <button
          type="button"
          onClick={handleAdd}
          className="inline-flex items-center justify-center rounded-xl border bg-[var(--admin-surface)] p-2 text-[var(--admin-muted)] transition hover:-translate-y-0.5 hover:border-peach-300 hover:text-peach-500 admin-border"
          aria-label="?la? ekle"
        >
          <Plus className="h-4 w-4" aria-hidden />
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {medications.length === 0 && <span className="text-xs font-semibold text-[var(--admin-muted)]">Hen?z ekleme yok.</span>}
        {medications.map((med, idx) => (
          <span
            key={`${med.name}-${idx}`}
            className="inline-flex items-center gap-2 rounded-full border bg-[var(--admin-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--admin-text-strong)] admin-border"
          >
            <span>{med.name}</span>
            {med.dosage && <span className="text-[var(--admin-muted)]">{med.dosage}</span>}
            {med.schedule && <span className="text-[var(--admin-muted)]">{med.schedule}</span>}
            {med.withFood && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.25em] text-emerald-700">Yemek</span>}
            <button
              type="button"
              onClick={() => handleRemove(idx)}
              className="rounded-full p-1 text-[var(--admin-muted)] transition hover:text-red-500"
              aria-label="Sil"
            >
              <Trash2 className="h-4 w-4" aria-hidden />
            </button>
          </span>
        ))}
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
  if (!status) {
    return steps.map((step, idx) => ({
      label: step.label,
      at: idx === 0 ? "Oluşturma tarihi" : "Plan",
      state: idx === 0 ? "active" : "pending",
    }));
  }

  if (status === ReservationStatus.CANCELLED) {
    return steps.map((step, idx) => {
      let state: "done" | "active" | "pending" | "disabled" = "pending";
      if (step.key === ReservationStatus.PENDING) {
        state = "done";
      } else if (step.key === ReservationStatus.CANCELLED) {
        state = "active";
      } else {
        state = "disabled";
      }
      return { label: step.label, at: idx === 0 ? "Oluşturma tarihi" : "Plan", state };
    });
  }

  const order = [
    ReservationStatus.PENDING,
    ReservationStatus.CONFIRMED,
    ReservationStatus.CHECKED_IN,
    ReservationStatus.CHECKED_OUT,
    ReservationStatus.CANCELLED,
  ];
  const currentIdx = order.indexOf(status);

  return steps.map((step, idx) => {
    let state: "done" | "active" | "pending" | "disabled" = "pending";
    if (idx < currentIdx) {
      state = "done";
    } else if (idx === currentIdx) {
      state = "done";
    } else if (idx === currentIdx + 1) {
      state = "active";
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

function toDatetimeLocal(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

function trimOrUndefined(value?: string | null) {
  const trimmed = (value ? "").trim();
  return trimmed.length ? trimmed : undefined;
}

function normalizeNumber(value?: string | null) {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

