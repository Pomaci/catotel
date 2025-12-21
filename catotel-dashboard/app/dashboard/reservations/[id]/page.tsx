'use client';

import { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useParams } from 'next/navigation';
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
  Users,
  Trash2,
  User,
  X,
  XCircle,
} from 'lucide-react';
import { HotelApi } from '@/lib/api/hotel';
import { useReservations } from '@/lib/hooks/useHotelData';
import type { CheckInForm, CheckOutForm, Reservation, Room } from '@/types/hotel';
import { ReservationStatus } from '@/types/enums';
import type { ReservationUpdatePayload } from '@/lib/api/payloads';

const PAYMENT_METHODS = ['CASH', 'CARD', 'ONLINE'] as const;
type PaymentMethod = (typeof PAYMENT_METHODS)[number];
type PaymentRecord = {
  id: string;
  amount: number | string;
  status: string;
  createdAt?: string;
  method?: string;
  transactionRef?: string | null;
};

export default function ReservationDetailPage() {
  const params = useParams<{ id: string }>();
  const reservationId = params?.id;
  const queryClient = useQueryClient();

  const {
    data: reservation,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['reservation', reservationId],
    enabled: Boolean(reservationId),
    queryFn: () => HotelApi.getReservation(reservationId!),
  });
  const {
    data: rooms,
    isLoading: roomsLoading,
    error: roomsError,
  } = useQuery({
    queryKey: ['rooms'],
    enabled: Boolean(reservationId),
    queryFn: () => HotelApi.listRoomUnits(),
  });
  const {
    data: checkedInReservations,
    isLoading: occupiedRoomsLoading,
    error: occupiedRoomsError,
  } = useReservations(ReservationStatus.CHECKED_IN, Boolean(reservationId));

  const updateMutation = useMutation({
    mutationFn: (payload: ReservationUpdatePayload) =>
      HotelApi.updateReservation(reservationId!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['reservation', reservationId],
      });
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
    },
    onError: (err) => {
      console.error(err);
      alert('Durum güncellenirken bir hata oluştu.');
    },
  });

  const [showCheckInForm, setShowCheckInForm] = useState(false);
  const [showCheckOutForm, setShowCheckOutForm] = useState(false);

  const trail = useMemo(() => buildTimeline(reservation?.status), [reservation?.status]);
  const roomTypeRooms = useMemo(
    () =>
      rooms && reservation
        ? rooms.filter((room) => room.roomType.id === reservation.roomType.id)
        : [],
    [rooms, reservation?.roomType.id],
  );
  const roomOccupancyInfo = useMemo<RoomOccupancyInfo>(() => {
    if (!reservation?.roomType?.id) return {};
    const capacity = Math.max(1, reservation.roomType.capacity ?? 1);
    const targetRoomTypeId = reservation.roomType.id;
    const info: RoomOccupancyInfo = {};
    (checkedInReservations ?? []).forEach((res) => {
      if (res.id === reservation.id) return;
      if (res.roomType?.id !== targetRoomTypeId) return;
      const roomId = res.checkInForm?.roomId?.trim();
      if (!roomId) return;
      const slotsUsed = resolveReservationSlotsForRoom(res, capacity);
      const current = info[roomId]?.occupied ?? 0;
      info[roomId] = {
        occupied: Math.min(capacity, current + slotsUsed),
        capacity,
      };
    });
    return info;
  }, [
    checkedInReservations,
    reservation?.id,
    reservation?.roomType?.capacity,
    reservation?.roomType?.id,
  ]);
  const occupiedRoomIds = useMemo(() => Object.keys(roomOccupancyInfo), [roomOccupancyInfo]);
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
          Rezervasyon yüklenemedi. {error instanceof Error ? error.message : ''}
        </p>
      </div>
    );
  }

  const totalExtras =
    reservation.services?.reduce((sum, s) => sum + Number(s.unitPrice) * s.quantity, 0) ?? 0;
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
          <StayCard reservation={reservation} nights={nights} rooms={roomTypeRooms} />
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
        rooms={roomTypeRooms}
        roomsLoading={roomsLoading}
        roomsError={roomsError instanceof Error ? roomsError.message : null}
        roomOccupancyInfo={roomOccupancyInfo}
        occupiedRoomIds={occupiedRoomIds}
        occupiedRoomsLoading={occupiedRoomsLoading}
        occupiedRoomsError={occupiedRoomsError instanceof Error ? occupiedRoomsError.message : null}
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

function HeaderCard({
  reservation,
  nights,
  onCancel,
  isUpdating,
}: {
  reservation: Reservation;
  nights: number;
  onCancel: () => void;
  isUpdating: boolean;
}) {
  const primaryCat = reservation.cats[0]?.cat;
  return (
    <div className="admin-surface flex flex-col gap-4 p-6 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--admin-highlight-muted)] text-peach-500">
          <Home className="h-5 w-5" aria-hidden />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-[var(--admin-text-strong)]">
            Rezervasyon #{reservation.code}
          </h1>
          <p className="mt-1 text-sm text-[var(--admin-muted)]">
            Müşteri: {reservation.customer?.user.name ?? 'Bilinmiyor'} • Kedi:{' '}
            {primaryCat?.name ?? '?'} {primaryCat?.breed ? `(${primaryCat.breed})` : ''}
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
          {isUpdating ? 'İptal ediliyor...' : 'İptal Et'}
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
        <h2 className="text-sm font-semibold uppercase tracking-[0.25em] text-[var(--admin-muted)]">
          {title}
        </h2>
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
            <p className="text-base font-semibold">
              {reservation.customer?.user.name ?? 'Bilinmiyor'}
            </p>
            <p className="text-xs text-[var(--admin-muted)]">
              {reservation.customer?.user.email ?? 'E-posta yok'}
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
              <p className="text-xs text-[var(--admin-muted)]">
                {catEntry.cat.breed ?? 'Cins bilinmiyor'}
              </p>
            </div>
          </div>
        ))}
      </div>
    </CardShell>
  );
}

function StayCard({
  reservation,
  nights,
  rooms,
}: {
  reservation: Reservation;
  nights: number;
  rooms?: Room[];
}) {
  const roomNameLookup = new Map((rooms ?? []).map((room) => [room.id, room.name]));
  const checkInRoomName =
    reservation.checkInForm?.roomId && roomNameLookup.size
      ? (roomNameLookup.get(reservation.checkInForm.roomId) ?? reservation.checkInForm.roomId)
      : (reservation.checkInForm?.roomId ?? null);
  const plannedAssignments = reservation.roomAssignments ?? [];
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
            <p className="text-xs text-[var(--admin-muted)]">
              {reservation.roomType.description ?? 'Oda detayı belirtilmemiş.'}
            </p>
            {checkInRoomName && (
              <p className="mt-1 text-xs font-semibold text-[var(--admin-text-strong)]">
                Atanan oda: {checkInRoomName}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-2xl bg-[var(--admin-surface-alt)] px-3 py-3">
          <CalendarRange className="h-4 w-4 text-peach-400" aria-hidden />
          <div>
            <p className="text-sm font-semibold">
              Giriş: {formatDateTime(reservation.checkIn)} • Çıkış:{' '}
              {formatDateTime(reservation.checkOut)}
            </p>
            <p className="text-xs text-[var(--admin-muted)]">{nights} gece</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-2xl bg-[var(--admin-surface-alt)] px-3 py-3">
          <Users className="h-4 w-4 text-peach-400" aria-hidden />
          <div>
            <p className="text-sm font-semibold">
              {reservation.allowRoomSharing === false ? 'Özel kullanım' : 'Paylaşıma açık'}
            </p>
            <p className="text-xs text-[var(--admin-muted)]">
              {reservation.allowRoomSharing === false
                ? 'Oda tamamen bu rezervasyona ayrıldı.'
                : 'Müsait slotlarda diğer rezervasyonlar paylaşabilir.'}
            </p>
          </div>
        </div>
      </div>
      {plannedAssignments.length > 0 && (
        <div className="rounded-2xl border border-dashed border-[var(--admin-border)] bg-[var(--admin-surface-alt)] p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--admin-muted)]">
            Planlanan oda paylaşımı
          </p>
          <div className="mt-2 space-y-2">
            {plannedAssignments.map((assignment) => (
              <div
                key={assignment.id}
                className="flex flex-col gap-1 rounded-xl border bg-[var(--admin-surface)] px-3 py-2 text-sm font-semibold admin-border md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p>{assignment.room.name}</p>
                  <p className="text-xs font-semibold text-[var(--admin-muted)]">
                    {formatDateTime(assignment.checkIn)} → {formatDateTime(assignment.checkOut)}
                  </p>
                </div>
                <div className="text-xs font-semibold text-[var(--admin-muted)]">
                  {assignment.catCount} kedi ·{' '}
                  {assignment.allowRoomSharing === false ? 'Özel kullanım' : 'Paylaşıma açık'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </CardShell>
  );
}

function ExtrasCard({
  reservation,
  totalExtras,
}: {
  reservation: Reservation;
  totalExtras: number;
}) {
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
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--admin-muted)]">
          Müşteri notu
        </p>
        <p className="text-sm leading-relaxed text-[var(--admin-text-strong)]">
          {reservation.specialRequests ?? 'Not yok'}
        </p>
      </div>
      <div className="space-y-2 rounded-2xl bg-[var(--admin-surface-alt)] p-3">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--admin-muted)]">
          Operasyon notu
        </p>
        <p className="text-sm leading-relaxed text-[var(--admin-text-strong)]">
          {reservation.services.length
            ? 'Ek hizmetler planlandı, operasyonu takip edin.'
            : 'İç operasyon notu girilmedi.'}
        </p>
      </div>
    </CardShell>
  );
}

type TimelineStep = {
  label: string;
  at: string;
  state: 'done' | 'active' | 'pending' | 'disabled';
};

function TimelineCard({ trail }: { trail: TimelineStep[] }) {
  return (
    <CardShell
      title="Durum"
      action={
        <span className="status-badge" data-variant="checkin">
          Akış
        </span>
      }
    >
      <div className="timeline">
        {trail.map((step) => (
          <div key={step.label} className="timeline__item">
            <div
              className={clsx(
                'timeline__icon',
                step.state === 'done' && 'is-done',
                step.state === 'active' && 'is-active',
                step.state === 'pending' && 'is-pending',
                step.state === 'disabled' && 'is-disabled',
              )}
            >
              {step.state === 'done' && <Check className="h-3.5 w-3.5" aria-hidden />}
              {step.state === 'active' && <Clock3 className="h-3.5 w-3.5" aria-hidden />}
              {step.state === 'pending' && <Info className="h-3.5 w-3.5" aria-hidden />}
              {step.state === 'disabled' && <AlertTriangle className="h-3.5 w-3.5" aria-hidden />}
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
                onStatusChange(
                  isConfirmed ? ReservationStatus.PENDING : ReservationStatus.CONFIRMED,
                )
              }
              disabled={!(canConfirm || isConfirmed) || isUpdating}
              className={clsx(
                'flex items-center justify-center gap-2 rounded-2xl bg-peach-500 px-4 py-3 text-sm font-semibold text-white shadow transition hover:-translate-y-0.5 hover:shadow-lg',
                (!(canConfirm || isConfirmed) || isUpdating) &&
                  'opacity-60 hover:translate-y-0 hover:shadow-none',
              )}
            >
              <Check className="h-4 w-4" aria-hidden />
              {isUpdating
                ? isConfirmed
                  ? 'Onay geri alınıyor...'
                  : 'Onaylanıyor...'
                : isConfirmed
                  ? 'Onayı Geri Al'
                  : 'Rezervasyonu Onayla'}
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
                'flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white shadow transition hover:-translate-y-0.5 hover:shadow-lg',
                (!canCheckIn || isUpdating) && 'opacity-60 hover:translate-y-0 hover:shadow-none',
              )}
            >
              <CheckCircle2 className="h-4 w-4" aria-hidden />
              {isUpdating
                ? 'İşlem yapılıyor...'
                : isCheckedIn
                  ? 'Check-in Geri Al (Onaya dön)'
                  : 'Check-in Yap'}
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
                'flex items-center justify-center gap-2 rounded-2xl bg-peach-400 px-4 py-3 text-sm font-semibold text-white shadow transition hover:-translate-y-0.5 hover:shadow-lg',
                (!canCheckOut || isUpdating) && 'opacity-60 hover:translate-y-0 hover:shadow-none',
              )}
            >
              <DoorOpen className="h-4 w-4" aria-hidden />
              {isUpdating
                ? 'İşlem yapılıyor...'
                : isCheckedOut
                  ? 'Check-out Geri Al'
                  : 'Check-out Yap'}
            </button>
          </>
        )}
        {isCancelled && (
          <button
            type="button"
            onClick={() => onStatusChange(ReservationStatus.CONFIRMED)}
            disabled={isUpdating}
            className={clsx(
              'flex items-center justify-center gap-2 rounded-2xl bg-[var(--admin-highlight-muted)] px-4 py-3 text-sm font-semibold text-[var(--admin-text-strong)] shadow transition hover:-translate-y-0.5 hover:shadow-lg',
              isUpdating && 'opacity-60 hover:translate-y-0 hover:shadow-none',
            )}
          >
            <CheckCircle2 className="h-4 w-4" aria-hidden />
            {isUpdating ? 'Geri alınıyor...' : 'İptali Geri Al (Onayla)'}
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
              'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold text-red-500 transition hover:-translate-y-0.5 hover:border-red-200 hover:text-red-600 admin-border',
              (!canCancel || isUpdating) && 'opacity-60 hover:translate-y-0',
            )}
          >
            <XCircle className="h-4 w-4" aria-hidden />
            {isUpdating ? 'İşlem yapılıyor...' : 'İptal Et'}
          </button>
        </div>
      )}

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <div className="space-y-1 rounded-2xl border bg-[var(--admin-surface-alt)] px-4 py-3 text-sm admin-border">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] admin-muted">
              Check-in Kaydı
            </p>
            <button
              type="button"
              onClick={onOpenCheckInForm}
              className="text-xs font-semibold text-peach-500 hover:underline"
            >
              Formu goster
            </button>
          </div>
          <p className="text-sm font-semibold text-[var(--admin-text-strong)]">
            {reservation.checkInForm?.arrivalTime
              ? `${formatDateTime(reservation.checkInForm.arrivalTime)} - ${
                  reservation.checkInForm?.deliveredItems?.length ?? 0
                } esya`
              : 'Henuz kaydedilmedi'}
          </p>
          {reservation.checkInForm?.catCondition && (
            <p className="text-xs admin-muted">Not: {reservation.checkInForm.catCondition}</p>
          )}
        </div>
        <div className="space-y-1 rounded-2xl border bg-[var(--admin-surface-alt)] px-4 py-3 text-sm admin-border">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] admin-muted">
              Check-out Kaydı
            </p>
            <button
              type="button"
              onClick={onOpenCheckOutForm}
              className="text-xs font-semibold text-peach-500 hover:underline"
            >
              Formu goster
            </button>
          </div>
          <p className="text-sm font-semibold text-[var(--admin-text-strong)]">
            {reservation.checkOutForm?.departureTime
              ? `${formatDateTime(reservation.checkOutForm.departureTime)} - ${
                  reservation.checkOutForm?.returnedItems?.length ?? 0
                } esya`
              : 'Henuz kaydedilmedi'}
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

function PaymentCard({
  reservation,
  totalExtras,
}: {
  reservation: Reservation;
  totalExtras: number;
}) {
  const queryClient = useQueryClient();
  const [method, setMethod] = useState<PaymentMethod>('CASH');
  const [amount, setAmount] = useState('');
  const [transactionRef, setTransactionRef] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const paymentMutation = useMutation({
    mutationFn: (payload: { amount: number; method: PaymentMethod; transactionRef?: string }) =>
      HotelApi.addReservationPayment(reservation.id, payload),
    onSuccess: () => {
      setAmount('');
      setTransactionRef('');
      setFormError(null);
      void queryClient.invalidateQueries({
        queryKey: ['reservation', reservation.id],
      });
      void queryClient.invalidateQueries({ queryKey: ['reservations'] });
    },
    onError: (err: any) => {
      setFormError(err?.message ?? 'Ödeme kaydı eklenemedi.');
    },
  });

  const payments = (reservation.payments ?? []) as PaymentRecord[];
  const paidTotal = payments.reduce((sum, payment) => {
    if (payment.status !== 'PAID') return sum;
    return sum + (Number(payment.amount) || 0);
  }, 0);
  const totalAmount = Number(reservation.totalPrice) || 0;
  const remaining = Math.max(0, totalAmount - paidTotal);

  const handlePaymentSubmit = () => {
    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setFormError('Gecerli bir tutar girin.');
      return;
    }
    setFormError(null);
    paymentMutation.mutate({
      amount: parsedAmount,
      method,
      transactionRef: trimOrUndefined(transactionRef),
    });
  };

  return (
    <CardShell title="Ödeme">
      <div className="flex items-center justify-between">
        <p className="text-lg font-semibold">Toplam: {formatCurrency(reservation.totalPrice)}</p>
        <span className="status-badge" data-variant="checkin">
          Ödeme Durumu
        </span>
      </div>
      <div className="space-y-1 rounded-2xl bg-[var(--admin-surface-alt)] p-3 text-sm">
        <Line label="Oda Ücreti" value={formatCurrency(reservation.totalPrice)} />
        <Line label="Ek hizmetler" value={formatCurrency(totalExtras)} />
        <Line label="Alinan ödeme" value={formatCurrency(paidTotal)} />
        <Line label="Kalan tutar" value={formatCurrency(remaining)} />
      </div>
      <div className="space-y-3 rounded-2xl border bg-[var(--admin-surface-alt)] p-3 admin-border">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--admin-muted)]">
          Manuel ödeme kaydı
        </p>
        <div className="grid gap-2 md:grid-cols-3">
          <label className="space-y-1 text-xs font-semibold text-[var(--admin-muted)]">
            Ödeme yontemi
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as PaymentMethod)}
              className="w-full rounded-xl border bg-[var(--admin-surface)] px-3 py-2 text-sm font-semibold text-[var(--admin-text-strong)] focus:outline-none focus:ring-2 focus:ring-peach-300 admin-border"
            >
              {PAYMENT_METHODS.map((value) => (
                <option key={value} value={value}>
                  {formatPaymentMethod(value)}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-xs font-semibold text-[var(--admin-muted)]">
            Tutar
            <input
              type="number"
              min="0"
              step="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="w-full rounded-xl border bg-[var(--admin-surface)] px-3 py-2 text-sm font-semibold text-[var(--admin-text-strong)] placeholder:text-[var(--admin-muted)] focus:outline-none focus:ring-2 focus:ring-peach-300 admin-border"
            />
          </label>
          <label className="space-y-1 text-xs font-semibold text-[var(--admin-muted)]">
            Referans (opsiyonel)
            <input
              type="text"
              value={transactionRef}
              onChange={(e) => setTransactionRef(e.target.value)}
              placeholder="POS/transfer no"
              className="w-full rounded-xl border bg-[var(--admin-surface)] px-3 py-2 text-sm font-semibold text-[var(--admin-text-strong)] placeholder:text-[var(--admin-muted)] focus:outline-none focus:ring-2 focus:ring-peach-300 admin-border"
            />
          </label>
        </div>
        {formError && <p className="text-xs font-semibold text-red-500">{formError}</p>}
        <button
          type="button"
          onClick={handlePaymentSubmit}
          disabled={paymentMutation.isPending}
          className="inline-flex items-center gap-2 rounded-full bg-peach-400 px-4 py-2 text-sm font-semibold text-white shadow-glow transition hover:-translate-y-0.5 disabled:opacity-60"
        >
          <Download className="h-4 w-4" aria-hidden />
          {paymentMutation.isPending ? 'Kaydediliyor...' : 'Ödeme Al'}
        </button>
      </div>
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--admin-muted)]">
          Ödeme listesi
        </p>
        {payments.length === 0 && (
          <p className="text-sm text-[var(--admin-muted)]">Henuz ödeme kaydı yok.</p>
        )}
        {payments.map((payment) => (
          <div
            key={payment.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border px-3 py-2 text-sm admin-border"
          >
            <div>
              <p className="text-sm font-semibold text-[var(--admin-text-strong)]">
                {formatPaymentMethod(payment.method)} · {formatCurrency(payment.amount)}
              </p>
              <p className="text-xs text-[var(--admin-muted)]">
                {payment.transactionRef ? `Ref: ${payment.transactionRef}` : 'Referans yok'}
                {payment.createdAt ? ` · ${formatDateTime(payment.createdAt)}` : ''}
              </p>
            </div>
            <span className="rounded-full bg-[var(--admin-highlight-muted)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--admin-text-strong)]">
              {formatPaymentStatus(payment.status)}
            </span>
          </div>
        ))}
      </div>
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
  const tabs = ['Günlük Raporlar', 'Medya', 'Geçmiş İşlemler', 'Formlar', 'Mesajlar'];
  return (
    <div className="admin-surface p-5">
      <div className="flex flex-wrap items-center gap-2">
        {tabs.map((tab, idx) => (
          <button
            // eslint-disable-next-line react/no-array-index-key
            key={idx}
            type="button"
            className={clsx(
              'rounded-full px-4 py-2 text-sm font-semibold transition',
              idx === 0
                ? 'bg-[var(--admin-highlight-muted)] text-[var(--admin-text-strong)] shadow-sm'
                : 'text-[var(--admin-muted)] hover:text-[var(--admin-text-strong)] hover:bg-[var(--admin-highlight-muted)]/60',
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

type RoomOccupancyInfo = Record<string, { occupied: number; capacity: number }>;

function CheckInFormModal({
  open,
  onClose,
  onSubmit,
  reservation,
  saving,
  rooms,
  roomsLoading,
  roomsError,
  roomOccupancyInfo,
  occupiedRoomIds,
  occupiedRoomsLoading,
  occupiedRoomsError,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (form: CheckInForm) => Promise<void>;
  reservation: Reservation;
  saving: boolean;
  rooms?: Room[];
  roomsLoading: boolean;
  roomsError: string | null;
  roomOccupancyInfo?: RoomOccupancyInfo;
  occupiedRoomIds?: string[];
  occupiedRoomsLoading?: boolean;
  occupiedRoomsError?: string | null;
}) {
  const [roomId, setRoomId] = useState('');
  const [arrivalTime, setArrivalTime] = useState('');
  const [deliveredItems, setDeliveredItems] = useState<ItemField[]>([]);
  const [foodPlan, setFoodPlan] = useState({
    brand: '',
    amountPerMeal: '',
    frequencyPerDay: '',
    instructions: '',
  });
  const [medications, setMedications] = useState<MedicationField[]>([]);
  const [weightKg, setWeightKg] = useState('');
  const [catCondition, setCatCondition] = useState('');
  const [hasVaccineCard, setHasVaccineCard] = useState(false);
  const [hasFleaTreatment, setHasFleaTreatment] = useState(false);
  const [handledBy, setHandledBy] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const occupancyInfo = roomOccupancyInfo ?? {};
  const defaultRoomCapacity = Math.max(1, reservation.roomType.capacity ?? 1);
  const roomOptions = useMemo(
    () => (rooms ?? []).filter((room) => room.roomType.id === reservation.roomType.id),
    [rooms, reservation.roomType.id],
  );
  const blockedRoomIds = useMemo(
    () =>
      new Set(
        (occupiedRoomIds ?? []).map((id) => id?.trim()).filter((id): id is string => Boolean(id)),
      ),
    [occupiedRoomIds],
  );
  const plannedAssignment = reservation.roomAssignments?.[0];
  const assignmentRoomId = plannedAssignment?.room.id ?? '';
  const assignedRoomId = reservation.checkInForm?.roomId ?? assignmentRoomId ?? '';
  const availableRooms = useMemo(
    () =>
      roomOptions.filter((room) => {
        if (assignedRoomId && room.id === assignedRoomId) return true;
        return !blockedRoomIds.has(room.id);
      }),
    [roomOptions, assignedRoomId, blockedRoomIds],
  );

  useEffect(() => {
    if (!open) return;

    const arrivalSource =
      reservation.checkInForm?.arrivalTime ?? reservation.checkedInAt ?? reservation.checkIn;

    setArrivalTime(toDatetimeLocal(arrivalSource));
    setRoomId(reservation.checkInForm?.roomId ?? assignmentRoomId ?? '');
    setDeliveredItems(
      (reservation.checkInForm?.deliveredItems ?? []).map((item) => ({
        label: item.label,
        quantity: item.quantity ? String(item.quantity) : '',
        note: item.note ?? '',
      })),
    );

    const existingFoodPlan = reservation.checkInForm?.foodPlan;
    setFoodPlan({
      brand: existingFoodPlan?.brand ?? '',
      amountPerMeal: existingFoodPlan?.amountPerMeal ?? '',
      frequencyPerDay: existingFoodPlan?.frequencyPerDay
        ? String(existingFoodPlan.frequencyPerDay)
        : '',
      instructions: existingFoodPlan?.instructions ?? reservation.specialRequests ?? '',
    });

    setMedications(
      (reservation.checkInForm?.medicationPlan ?? []).map((med) => ({
        name: med.name,
        dosage: med.dosage ?? '',
        schedule: med.schedule ?? '',
        withFood: Boolean(med.withFood),
        notes: med.notes ?? '',
      })),
    );
    setWeightKg(reservation.checkInForm?.weightKg ? String(reservation.checkInForm.weightKg) : '');
    setCatCondition(reservation.checkInForm?.catCondition ?? '');
    setHasVaccineCard(Boolean(reservation.checkInForm?.hasVaccineCard));
    setHasFleaTreatment(Boolean(reservation.checkInForm?.hasFleaTreatment));
    setHandledBy(reservation.checkInForm?.handledBy ?? '');
    setAdditionalNotes(reservation.checkInForm?.additionalNotes ?? '');
    setError(null);
  }, [open, reservation, assignmentRoomId]);

  useEffect(() => {
    if (!open) return;
    if (roomId) {
      const stillSelectable = availableRooms.some((room) => room.id === roomId);
      if (!stillSelectable) {
        setRoomId('');
      }
      return;
    }
    if (assignmentRoomId && availableRooms.some((room) => room.id === assignmentRoomId)) {
      setRoomId(assignmentRoomId);
      return;
    }
    if (availableRooms.length === 1) {
      setRoomId(availableRooms[0].id);
    }
  }, [open, roomId, availableRooms, assignmentRoomId]);

  if (!open) return null;

  const handleSubmit = async () => {
    const normalizedItems = deliveredItems
      .map((item) => ({
        label: item.label.trim(),
        quantity: item.quantity ? Number(item.quantity) : undefined,
        note: trimOrUndefined(item.note),
      }))
      .filter((item) => item.label.length > 0);

    if (!arrivalTime) {
      setError('Check-in saati girmelisin.');
      return;
    }
    if (!roomId) {
      setError('Kedinin kalacagi odayi secmelisin.');
      return;
    }
    const selectedRoom = roomOptions.find((room) => room.id === roomId);
    if (roomOptions.length > 0 && !selectedRoom) {
      setError('Secilen oda, rezervasyon oda tipiyle uyumlu olmali.');
      return;
    }
    if (blockedRoomIds.has(roomId) && roomId !== assignedRoomId) {
      setError('Secilen oda su anda dolu, lütfen baska bir oda sec.');
      return;
    }

    const normalizedFoodPlan =
      foodPlan.brand || foodPlan.amountPerMeal || foodPlan.frequencyPerDay || foodPlan.instructions
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
      deliveredItems: normalizedItems.length ? normalizedItems : undefined,
      foodPlan: normalizedFoodPlan,
      medicationPlan: normalizedMedications.length ? normalizedMedications : undefined,
      weightKg: normalizeNumber(weightKg),
      catCondition: trimOrUndefined(catCondition),
      roomId,
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
      description="Gelişte teslim alınan eşyaları, saati ve klinik/güvenlik kontrollerini kaydet."
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold text-[var(--admin-text-strong)] transition hover:-translate-y-0.5 hover:border-peach-300 hover:text-peach-500 admin-border"
            disabled={saving}
          >
            Vazgeç
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className={clsx(
              'inline-flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white shadow-glow transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70',
            )}
          >
            {saving ? 'Kaydediliyor...' : "Check-in'i Tamamla"}
          </button>
        </>
      }
    >
      <div className="space-y-2">
        {plannedAssignment && (
          <div className="rounded-2xl border border-dashed border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 py-2 text-xs font-semibold text-[var(--admin-muted)]">
            Planlanan oda:{' '}
            <span className="text-[var(--admin-text-strong)]">{plannedAssignment.room.name}</span> (
            {plannedAssignment.catCount} kedi ·{' '}
            {plannedAssignment.allowRoomSharing === false ? 'özel kullanım' : 'paylaşımlı'})
          </div>
        )}
        <label className="text-sm font-semibold text-[var(--admin-text-strong)]">
          Kalacagi oda
        </label>
        <select
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          disabled={roomsLoading || roomOptions.length === 0 || Boolean(occupiedRoomsLoading)}
          className="w-full rounded-xl border bg-[var(--admin-surface-alt)] px-3 py-2 text-sm text-[var(--admin-text-strong)] focus:outline-none focus:ring-2 focus:ring-peach-300 admin-border"
        >
          <option value="">Oda sec</option>
          {roomOptions.map((room) => {
            const isBlocked = blockedRoomIds.has(room.id) && room.id !== assignedRoomId;
            const occupancy = occupancyInfo[room.id];
            const capacityForRoom = Math.max(
              1,
              occupancy?.capacity ?? room.roomType.capacity ?? defaultRoomCapacity,
            );
            const occupiedCount = Math.min(occupancy?.occupied ?? 0, capacityForRoom);
            const occupancyPercent = Math.round((occupiedCount / capacityForRoom) * 100);
            return (
              <option key={room.id} value={room.id} disabled={isBlocked}>
                {`${room.name} - %${occupancyPercent} dolu (${occupiedCount}/${capacityForRoom})${
                  isBlocked ? ' (Dolu)' : ''
                }`}
              </option>
            );
          })}
        </select>
        {roomsLoading && <p className="text-xs text-[var(--admin-muted)]">Odalar yukleniyor...</p>}
        {!roomsLoading && occupiedRoomsLoading && (
          <p className="text-xs text-[var(--admin-muted)]">Oda doluluk bilgisi guncelleniyor...</p>
        )}
        {!roomsLoading && roomsError && (
          <p className="text-xs font-semibold text-red-500">Oda listesi alinamadi: {roomsError}</p>
        )}
        {!roomsLoading && !roomsError && !occupiedRoomsLoading && occupiedRoomsError && (
          <p className="text-xs font-semibold text-red-500">
            Dolu oda bilgisi alinamadi: {occupiedRoomsError}
          </p>
        )}
        {!roomsLoading && !roomsError && roomOptions.length === 0 && (
          <p className="text-xs font-semibold text-red-500">
            Bu oda tipi icin aktif oda bulunamadi.
          </p>
        )}
        {!roomsLoading && !roomsError && roomOptions.length > 0 && availableRooms.length === 0 && (
          <p className="text-xs font-semibold text-red-500">Bu oda tipi icin bos oda kalmadi.</p>
        )}
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-[var(--admin-text-strong)]">
            Check-in saati
          </label>
          <input
            type="datetime-local"
            value={arrivalTime}
            onChange={(e) => setArrivalTime(e.target.value)}
            className="w-full rounded-xl border bg-[var(--admin-surface-alt)] px-3 py-2 text-sm text-[var(--admin-text-strong)] focus:outline-none focus:ring-2 focus:ring-peach-300 admin-border"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-[var(--admin-text-strong)]">
            Teslim anı gözlemleri
          </label>
          <textarea
            value={catCondition}
            onChange={(e) => setCatCondition(e.target.value)}
            rows={3}
            placeholder="Durum, yara, davranış, tüy durumu, tırmalama bilgisi..."
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
        title="Teslim edilen eşyalar"
        items={deliveredItems}
        onChange={setDeliveredItems}
        addLabel="Eşya ekle"
        placeholder="Taşıma kutusu, mama, ilaç..."
      />

      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-3 rounded-2xl border bg-[var(--admin-surface-alt)] p-3 admin-border">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Beslenme planı</p>
            <span className="text-[10px] font-semibold uppercase tracking-[0.3em] admin-muted">
              Günlük rutin
            </span>
          </div>
          <input
            type="text"
            value={foodPlan.brand}
            onChange={(e) => setFoodPlan((prev) => ({ ...prev, brand: e.target.value }))}
            placeholder="Mama markası / tipi"
            className="rounded-xl border bg-[var(--admin-surface)] px-3 py-2 text-sm text-[var(--admin-text-strong)] placeholder:text-[var(--admin-muted)] focus:outline-none focus:ring-2 focus:ring-peach-300 admin-border"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              value={foodPlan.amountPerMeal}
              onChange={(e) =>
                setFoodPlan((prev) => ({
                  ...prev,
                  amountPerMeal: e.target.value,
                }))
              }
              placeholder="Öğün başı miktar"
              className="rounded-xl border bg-[var(--admin-surface)] px-3 py-2 text-sm text-[var(--admin-text-strong)] placeholder:text-[var(--admin-muted)] focus:outline-none focus:ring-2 focus:ring-peach-300 admin-border"
            />
            <input
              type="number"
              min="1"
              value={foodPlan.frequencyPerDay}
              onChange={(e) =>
                setFoodPlan((prev) => ({
                  ...prev,
                  frequencyPerDay: e.target.value,
                }))
              }
              placeholder="Günde kaç öğün"
              className="rounded-xl border bg-[var(--admin-surface)] px-3 py-2 text-sm text-[var(--admin-text-strong)] placeholder:text-[var(--admin-muted)] focus:outline-none focus:ring-2 focus:ring-peach-300 admin-border"
            />
          </div>
          <textarea
            value={foodPlan.instructions}
            onChange={(e) => setFoodPlan((prev) => ({ ...prev, instructions: e.target.value }))}
            rows={3}
            placeholder="Islak mama, oda sıcaklığı, alerji notu vb."
            className="w-full rounded-xl border bg-[var(--admin-surface)] px-3 py-2 text-sm text-[var(--admin-text-strong)] placeholder:text-[var(--admin-muted)] focus:outline-none focus:ring-2 focus:ring-peach-300 admin-border"
          />
        </div>
        <MedicationListEditor medications={medications} onChange={setMedications} />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2 rounded-2xl border bg-[var(--admin-surface-alt)] p-3 admin-border">
          <p className="text-sm font-semibold">Sağlık / güvenlik</p>
          <label className="flex items-center gap-2 text-sm font-semibold text-[var(--admin-text-strong)]">
            <input
              type="checkbox"
              checked={hasVaccineCard}
              onChange={(e) => setHasVaccineCard(e.target.checked)}
              className="h-4 w-4 rounded border-[var(--admin-border)] text-peach-500 focus:ring-peach-300"
            />
            Aşı karnesi / güncellemeler teslim alındı mı?
          </label>
          <label className="flex items-center gap-2 text-sm font-semibold text-[var(--admin-text-strong)]">
            <input
              type="checkbox"
              checked={hasFleaTreatment}
              onChange={(e) => setHasFleaTreatment(e.target.checked)}
              className="h-4 w-4 rounded border-[var(--admin-border)] text-peach-500 focus:ring-peach-300"
            />
            Pire/akar uygulaması yapıldı mı?
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
  const [departureTime, setDepartureTime] = useState('');
  const [returnedItems, setReturnedItems] = useState<ItemField[]>([]);
  const [catCondition, setCatCondition] = useState('');
  const [incidents, setIncidents] = useState('');
  const [roomConditionNote, setRoomConditionNote] = useState('');
  const [remainingFood, setRemainingFood] = useState('');
  const [nextVisitNote, setNextVisitNote] = useState('');
  const [handledBy, setHandledBy] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    const departureSource =
      reservation.checkOutForm?.departureTime ?? reservation.checkedOutAt ?? reservation.checkOut;

    setDepartureTime(toDatetimeLocal(departureSource));
    const returnedSource =
      reservation.checkOutForm?.returnedItems ??
      reservation.checkInForm?.deliveredItems ??
      [];
    setReturnedItems(
      returnedSource.map((item) => ({
        label: item.label,
        quantity: item.quantity ? String(item.quantity) : '',
        note: item.note ?? '',
      })),
    );
    setCatCondition(reservation.checkOutForm?.catCondition ?? '');
    setIncidents(reservation.checkOutForm?.incidents ?? '');
    setRoomConditionNote(reservation.checkOutForm?.roomConditionNote ?? '');
    setRemainingFood(reservation.checkOutForm?.remainingFood ?? '');
    setNextVisitNote(reservation.checkOutForm?.nextVisitNote ?? '');
    setHandledBy(reservation.checkOutForm?.handledBy ?? '');
    setAdditionalNotes(reservation.checkOutForm?.additionalNotes ?? '');
    setError(null);
  }, [open, reservation]);

  if (!open) return null;

  const handleSubmit = async () => {
    const normalizedItems = returnedItems
      .map((item) => ({
        label: item.label.trim(),
        quantity: item.quantity ? Number(item.quantity) : undefined,
        note: trimOrUndefined(item.note),
      }))
      .filter((item) => item.label.length > 0);

    if (!departureTime) {
      setError('Check-out saati girmelisin.');
      return;
    }
    if (!catCondition.trim()) {
      setError('Çıkış durumunu yazmalısın.');
      return;
    }

    const payload: CheckOutForm = {
      departureTime: new Date(departureTime).toISOString(),
      returnedItems: normalizedItems.length ? normalizedItems : undefined,
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
      description="Çıkış saati, teslim edilen eşyaları ve çıkıştaki durum gözlemlerini kaydet."
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold text-[var(--admin-text-strong)] transition hover:-translate-y-0.5 hover:border-peach-300 hover:text-peach-500 admin-border"
            disabled={saving}
          >
            Vazgeç
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-full bg-peach-500 px-5 py-2.5 text-sm font-semibold text-white shadow-glow transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {saving ? 'Kaydediliyor...' : "Check-out'u Tamamla"}
          </button>
        </>
      }
    >
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-[var(--admin-text-strong)]">
            Check-out saati
          </label>
          <input
            type="datetime-local"
            value={departureTime}
            onChange={(e) => setDepartureTime(e.target.value)}
            className="w-full rounded-xl border bg-[var(--admin-surface-alt)] px-3 py-2 text-sm text-[var(--admin-text-strong)] focus:outline-none focus:ring-2 focus:ring-peach-300 admin-border"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-[var(--admin-text-strong)]">
            Çıkış gözlemi
          </label>
          <textarea
            value={catCondition}
            onChange={(e) => setCatCondition(e.target.value)}
            rows={3}
            placeholder="Teslim anında davranış, tüy durumu, yara kontrolü..."
            className="w-full rounded-xl border bg-[var(--admin-surface-alt)] px-3 py-2 text-sm text-[var(--admin-text-strong)] placeholder:text-[var(--admin-muted)] focus:outline-none focus:ring-2 focus:ring-peach-300 admin-border"
          />
        </div>
      </div>

      <EditableItemList
        title="Geri teslim edilen eşyalar"
        items={returnedItems}
        onChange={setReturnedItems}
        addLabel="Eşya ekle"
        placeholder="Taşıma kutusu, mama, ilaç..."
      />

      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2 rounded-2xl border bg-[var(--admin-surface-alt)] p-3 admin-border">
          <p className="text-sm font-semibold">Temizlik & hasar</p>
          <textarea
            value={roomConditionNote}
            onChange={(e) => setRoomConditionNote(e.target.value)}
            rows={3}
            placeholder="Oda durumu, temizlik ihtiyacı, hasar vb."
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
          <p className="text-sm font-semibold">Kapanış notları</p>
          <input
            type="text"
            value={remainingFood}
            onChange={(e) => setRemainingFood(e.target.value)}
            placeholder="Kalan mama / ilaç bilgisi"
            className="rounded-2xl border bg-[var(--admin-surface)] px-3 py-2 text-sm text-[var(--admin-text-strong)] placeholder:text-[var(--admin-muted)] focus:outline-none focus:ring-2 focus:ring-peach-300 admin-border"
          />
          <input
            type="text"
            value={nextVisitNote}
            onChange={(e) => setNextVisitNote(e.target.value)}
            placeholder="Takip / sonraki ziyarete hatırlatma"
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
            placeholder="Müşteri ile paylaşılacak mesaj / iş notu"
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
            <p className="text-xs font-semibold uppercase tracking-[0.35em] admin-muted">
              Operasyon
            </p>
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
  const [draft, setDraft] = useState<ItemField>({
    label: '',
    quantity: '',
    note: '',
  });

  const handleAdd = () => {
    if (!draft.label.trim()) return;
    const trimmedQuantity = draft.quantity?.trim() ?? '';
    const trimmedNote = draft.note?.trim() ?? '';
    onChange([
      ...items,
      {
        label: draft.label.trim(),
        quantity: trimmedQuantity,
        note: trimmedNote,
      },
    ]);
    setDraft({ label: '', quantity: '', note: '' });
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
          placeholder={placeholder ?? 'Eşya'}
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
        {items.length === 0 && (
          <span className="text-xs font-semibold text-[var(--admin-muted)]">Henüz ekleme yok.</span>
        )}
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
    name: '',
    dosage: '',
    schedule: '',
    withFood: false,
    notes: '',
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
    setDraft({
      name: '',
      dosage: '',
      schedule: '',
      withFood: false,
      notes: '',
    });
  };

  const handleRemove = (index: number) => {
    onChange(medications.filter((_, idx) => idx !== index));
  };

  return (
    <div className="space-y-2 rounded-2xl border bg-[var(--admin-surface-alt)] p-3 admin-border">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">İlaç / takviye planı</p>
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
          placeholder="İlaç / takviye adı"
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
          aria-label="İlaç ekle"
        >
          <Plus className="h-4 w-4" aria-hidden />
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {medications.length === 0 && (
          <span className="text-xs font-semibold text-[var(--admin-muted)]">Henüz ekleme yok.</span>
        )}
        {medications.map((med, idx) => (
          <span
            key={`${med.name}-${idx}`}
            className="inline-flex items-center gap-2 rounded-full border bg-[var(--admin-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--admin-text-strong)] admin-border"
          >
            <span>{med.name}</span>
            {med.dosage && <span className="text-[var(--admin-muted)]">{med.dosage}</span>}
            {med.schedule && <span className="text-[var(--admin-muted)]">{med.schedule}</span>}
            {med.withFood && (
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.25em] text-emerald-700">
                Yemek
              </span>
            )}
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

function buildTimeline(status?: ReservationStatus): TimelineStep[] {
  const steps = [
    { key: ReservationStatus.PENDING, label: 'Oluşturuldu' },
    { key: ReservationStatus.CONFIRMED, label: 'Onaylandı' },
    { key: ReservationStatus.CHECKED_IN, label: 'Check-in' },
    { key: ReservationStatus.CHECKED_OUT, label: 'Check-out' },
    { key: ReservationStatus.CANCELLED, label: 'İptal' },
  ];
  if (!status) {
    return steps.map((step, idx) => ({
      label: step.label,
      at: idx === 0 ? 'Oluşturma tarihi' : 'Plan',
      state: idx === 0 ? 'active' : 'pending',
    }));
  }

  if (status === ReservationStatus.CANCELLED) {
    return steps.map((step, idx) => {
      let state: 'done' | 'active' | 'pending' | 'disabled' = 'pending';
      if (step.key === ReservationStatus.PENDING) {
        state = 'done';
      } else if (step.key === ReservationStatus.CANCELLED) {
        state = 'active';
      } else {
        state = 'disabled';
      }
      return {
        label: step.label,
        at: idx === 0 ? 'Oluşturma tarihi' : 'Plan',
        state,
      };
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
    let state: 'done' | 'active' | 'pending' | 'disabled' = 'pending';
    if (idx < currentIdx) {
      state = 'done';
    } else if (idx === currentIdx) {
      state = 'done';
    } else if (idx === currentIdx + 1) {
      state = 'active';
    }

    return {
      label: step.label,
      at: idx === 0 ? 'Oluşturma tarihi' : 'Plan',
      state,
    };
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
  if (status === ReservationStatus.PENDING) return 'created';
  if (status === ReservationStatus.CONFIRMED) return 'confirmed';
  if (status === ReservationStatus.CHECKED_IN) return 'checkin';
  if (status === ReservationStatus.CHECKED_OUT) return 'checkout';
  return 'cancelled';
}

function formatStatus(status: ReservationStatus) {
  if (status === ReservationStatus.PENDING) return 'Oluşturuldu';
  if (status === ReservationStatus.CONFIRMED) return 'Onaylandı';
  if (status === ReservationStatus.CHECKED_IN) return 'Check-in';
  if (status === ReservationStatus.CHECKED_OUT) return 'Check-out';
  if (status === ReservationStatus.CANCELLED) return 'İptal';
  return status;
}

function formatDateTime(value: string) {
  const d = new Date(value);
  return d.toLocaleString('tr-TR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
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
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

function toDatetimeLocal(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

function trimOrUndefined(value?: string | null) {
  const trimmed = (value ?? '').trim();
  return trimmed.length ? trimmed : undefined;
}

function formatPaymentMethod(method?: string) {
  if (method === 'CASH') return 'Nakit';
  if (method === 'CARD') return 'Kart';
  if (method === 'ONLINE') return 'Online';
  return method && method.length ? method : 'Bilinmiyor';
}

function formatPaymentStatus(status?: string) {
  if (status === 'PAID') return 'PAID';
  if (status === 'PENDING') return 'PENDING';
  if (status === 'FAILED') return 'FAILED';
  if (status === 'REFUNDED') return 'REFUNDED';
  return status && status.length ? status : '-';
}

function normalizeNumber(value?: string | null) {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function resolveReservationSlotsForRoom(reservation: Reservation, capacity: number) {
  const normalizedCapacity = Math.max(1, capacity);
  if (reservation.reservedSlots && reservation.reservedSlots > 0) {
    return Math.min(reservation.reservedSlots, normalizedCapacity);
  }
  if (reservation.allowRoomSharing === false) {
    return normalizedCapacity;
  }
  const catCount = reservation.cats?.length ?? 0;
  if (catCount > 0) {
    return Math.min(catCount, normalizedCapacity);
  }
  return normalizedCapacity;
}
