import { startOfDay } from "date-fns";
import { ReservationStatus } from "@/types/enums";
import type { Reservation } from "@/types/hotel";

export type ReservationTask = {
  id: string;
  reservationId: string;
  type: "CHECKIN" | "CHECKOUT";
  scheduledAt: string | null;
  title: string;
  detail: string;
};

export function buildReservationTasks(
  reservations: Reservation[],
  now: Date = new Date(),
): ReservationTask[] {
  if (!reservations.length) return [];
  const today = startOfDay(now);
  const tasks: ReservationTask[] = [];

  reservations.forEach((reservation) => {
    const checkInDate = safeDate(reservation.checkIn);
    if (
      checkInDate &&
      isOnOrBeforeDay(checkInDate, today) &&
      (reservation.status === ReservationStatus.PENDING ||
        reservation.status === ReservationStatus.CONFIRMED)
    ) {
      tasks.push(
        buildTask({
          reservation,
          type: "CHECKIN",
          scheduledAt: reservation.checkIn ?? null,
        }),
      );
    }

    const checkOutDate = safeDate(reservation.checkOut);
    if (
      checkOutDate &&
      isOnOrBeforeDay(checkOutDate, today) &&
      reservation.status === ReservationStatus.CHECKED_IN
    ) {
      tasks.push(
        buildTask({
          reservation,
          type: "CHECKOUT",
          scheduledAt: reservation.checkOut ?? null,
        }),
      );
    }
  });

  return tasks.sort((a, b) => {
    const aTime = safeDate(a.scheduledAt)?.getTime() ?? Number.POSITIVE_INFINITY;
    const bTime = safeDate(b.scheduledAt)?.getTime() ?? Number.POSITIVE_INFINITY;
    return aTime - bTime;
  });
}

function buildTask({
  reservation,
  type,
  scheduledAt,
}: {
  reservation: Reservation;
  type: "CHECKIN" | "CHECKOUT";
  scheduledAt: string | null;
}): ReservationTask {
  const catName = reservation.cats?.[0]?.cat.name ?? "Kedi";
  const roomName = reservation.roomType?.name ?? "Oda";
  const customer =
    reservation.customer?.user.name ?? reservation.customer?.user.email ?? "Musteri";
  const timeLabel = formatTimeLabel(scheduledAt);
  const detailParts = [customer, reservation.code, timeLabel ? `Saat ${timeLabel}` : null].filter(
    Boolean,
  ) as string[];

  return {
    id: `reservation-${reservation.id}-${type.toLowerCase()}`,
    reservationId: reservation.id,
    type,
    scheduledAt,
    title: `${type === "CHECKIN" ? "Check-in" : "Check-out"} - ${catName} (${roomName})`,
    detail: detailParts.join(" | "),
  };
}

function isOnOrBeforeDay(value: Date, day: Date) {
  return startOfDay(value).getTime() <= day.getTime();
}

function safeDate(value?: string | null) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatTimeLabel(value?: string | null) {
  if (!value) return null;
  const parsed = safeDate(value);
  if (!parsed) return null;
  return parsed.toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
