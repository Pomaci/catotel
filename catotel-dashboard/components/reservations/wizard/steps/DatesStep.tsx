import clsx from "clsx";
import { CalendarRange, Home } from "lucide-react";

import type { ReservationRoomAssignment, RoomType } from "@/types/hotel";

import { Field, RoomAssignmentSummary, StepCard } from "../components";

type DatesStepProps = {
  checkIn: string;
  checkOut: string;
  todayIso: string;
  nightCount: number | null;
  onCheckInChange: (value: string) => void;
  onCheckOutChange: (value: string) => void;
  roomList: RoomType[];
  loadingAvailability: boolean;
  selectedRoomTypeId: string | null;
  onSelectRoomType: (roomId: string) => void;
  allowRoomSharing: boolean;
  onToggleRoomSharing: () => void;
  selectedCatCount: number;
  roomAssignments?: ReservationRoomAssignment[] | null;
};

export function DatesStep({
  checkIn,
  checkOut,
  todayIso,
  nightCount,
  onCheckInChange,
  onCheckOutChange,
  roomList,
  loadingAvailability,
  selectedRoomTypeId,
  onSelectRoomType,
  allowRoomSharing,
  onToggleRoomSharing,
  selectedCatCount,
  roomAssignments,
}: DatesStepProps) {
  return (
    <StepCard title="Tarih & Oda Tipi Uygunluğu">
      <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
        <div className="space-y-3 rounded-2xl border bg-[var(--admin-surface-alt)] p-4 admin-border">
          <p className="text-sm font-semibold">Tarih seç</p>
          <Field
            icon={<CalendarRange className="h-4 w-4" aria-hidden />}
            placeholder="Giriş tarihi"
            value={checkIn}
            onChange={onCheckInChange}
            min={todayIso}
            type="date"
          />
          <Field
            icon={<CalendarRange className="h-4 w-4" aria-hidden />}
            placeholder="Çıkış tarihi"
            value={checkOut}
            onChange={onCheckOutChange}
            min={checkIn || todayIso}
            type="date"
          />
          <div className="rounded-2xl bg-[var(--admin-surface)] px-3 py-2 text-sm font-semibold admin-border">
            {nightCount ? `${nightCount} gece` : "Gece sayısı otomatik hesaplanır."}
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Oda tipi uygunluk</p>
            <p className="text-xs font-semibold text-[var(--admin-muted)]">
              Seçtiğin kedilerin kapasiteye sığdığından emin ol.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {roomList.map((room) => {
              const totalUnits = room.totalUnits ?? 0;
              const allowedUnits = totalUnits + (room.overbookingLimit ?? 0);
              const capacity = Math.max(1, room.capacity);
              const rawAvailableSlots =
                typeof room.availableSlots === "number" ? room.availableSlots : null;
              const unitsToSlots =
                room.availableUnits !== null && room.availableUnits !== undefined
                  ? Math.max(0, room.availableUnits) * capacity
                  : null;
              const availableSlots = rawAvailableSlots ?? unitsToSlots;
              const availableUnits =
                room.availableUnits ??
                (availableSlots !== null ? Math.floor(availableSlots / capacity) : null);
              const isCurrentRoom =
                selectedRoomTypeId === room.id ||
                roomAssignments?.some((assignment) => assignment.room.id === room.id);
              const capacityOk = room.capacityOk ?? room.capacity >= selectedCatCount;
              const capacityWarning = selectedCatCount > 0 && !capacityOk;
              const requestedSlots = Math.max(selectedCatCount || 0, 1);
              const sharedBlocked =
                allowRoomSharing &&
                selectedCatCount > 0 &&
                availableSlots !== null &&
                availableSlots < requestedSlots;
              const exclusiveBlocked =
                !allowRoomSharing && availableUnits !== null && availableUnits <= 0;
              const availabilityKnown = allowRoomSharing
                ? availableSlots !== null
                : availableUnits !== null;
              const isUnavailable =
                capacityWarning || (allowRoomSharing ? sharedBlocked : exclusiveBlocked);
              const badgeLabel = capacityWarning
                ? `Kapasite yetersiz (${room.capacity} kedi)`
                : !availabilityKnown
                ? isCurrentRoom
                  ? "Mevcut seçim"
                  : "Uygunluk bilinmiyor"
                : allowRoomSharing
                ? availableSlots && availableSlots > 0
                  ? `Kalan slot: ${availableSlots}`
                  : "Slot yok"
                : availableUnits && availableUnits > 0
                ? `${availableUnits}/${allowedUnits} oda`
                : "Dolu";
              const badgeTone = capacityWarning
                ? "warn"
                : !availabilityKnown
                ? "muted"
                : isUnavailable
                ? "danger"
                : "success";
              return (
                <button
                  key={room.id}
                  type="button"
                  onClick={() => {
                    if ((isUnavailable || capacityWarning) && !isCurrentRoom) return;
                    onSelectRoomType(room.id);
                  }}
                  className={clsx(
                    "flex flex-col items-start gap-2 rounded-2xl border px-3 py-3 text-left transition admin-border",
                    selectedRoomTypeId === room.id
                      ? "border-peach-300 bg-[var(--admin-highlight-muted)]"
                      : (isUnavailable || capacityWarning) && !isCurrentRoom
                      ? "opacity-60 cursor-not-allowed"
                      : "hover:border-peach-200",
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Home className="h-4 w-4 text-peach-400" aria-hidden />
                    <p className="text-sm font-semibold">{room.name}</p>
                  </div>
                  <p className="text-xs text-[var(--admin-muted)]">
                    Kapasite: {room.capacity} kedi | Aktif oda: {totalUnits}
                  </p>
                  <span
                    className={clsx(
                      "mt-1 inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.25em]",
                      badgeTone === "danger" &&
                        "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-200",
                      badgeTone === "warn" &&
                        "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200",
                      badgeTone === "muted" &&
                        "bg-[var(--admin-surface)] text-[var(--admin-muted)] dark:bg-white/5",
                      badgeTone === "success" &&
                        "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200",
                    )}
                  >
                    {loadingAvailability ? "Kontrol ediliyor..." : badgeLabel}
                  </span>
                </button>
              );
            })}
          </div>
          {selectedRoomTypeId && (
            <div className="rounded-2xl border bg-[var(--admin-surface-alt)] p-4 admin-border">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-[var(--admin-text-strong)]">
                    Odayı paylaşma tercihi
                  </p>
                  <p className="text-xs text-[var(--admin-muted)]">
                    Kapasite {roomList.find((r) => r.id === selectedRoomTypeId)?.capacity ?? "-"} kedi. Bu rezervasyonda diğer müşterilerle paylaşmaya izin verip vermediğini seç.
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold admin-border">
                  <span className="text-[var(--admin-text-strong)]">
                    {allowRoomSharing ? "Paylaşmaya açık" : "Özel kullanım"}
                  </span>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      className="peer sr-only"
                      checked={!allowRoomSharing}
                      onChange={onToggleRoomSharing}
                    />
                    <div className="h-6 w-11 rounded-full bg-[var(--admin-border)] peer-checked:bg-peach-400 transition">
                      <div className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition peer-checked:translate-x-5 shadow" />
                    </div>
                  </label>
                </div>
              </div>
              <p className="mt-2 text-xs font-semibold text-[var(--admin-muted)]">
                Özel kullanım seçersen, oda kapasitesinin tamamı bu rezervasyon için bloklanır ve ücret tüm kapasite üzerinden hesaplanır. Paylaşmaya açık seçersen sadece kendi kedilerinin slotları kadar ücretlendirilir ve diğer müşteriler kalan slotları kullanabilir.
              </p>
            </div>
          )}
        </div>
      </div>
      {roomAssignments && <RoomAssignmentSummary assignments={roomAssignments} />}
    </StepCard>
  );
}
