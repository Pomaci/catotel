"use client";

import { forwardRef, useMemo, type SVGProps } from "react";
import clsx from "clsx";
import {
  AlertTriangle,
  ArrowUpRight,
  CalendarCheck2,
  Cat,
  CheckCircle2,
  DoorOpen,
  Ellipsis,
  Filter,
  LineChart,
  Pill,
  TrendingUp,
  UtensilsCrossed,
} from "lucide-react";
import { addDays, eachDayOfInterval, isSameDay, startOfDay } from "date-fns";
import { useReservations, useRooms, useStaffTasks } from "@/lib/hooks/useHotelData";
import { CareTaskStatus, CareTaskType, ReservationStatus } from "@/types/enums";
import type { CareTask, Reservation, RoomType } from "@/types/hotel";

type SummaryCard = {
  label: string;
  value: string;
  meta: string;
  trend?: string;
  trendDirection: "up" | "link" | "alert";
  icon: typeof DoorOpen;
};

type TodayReservationRow = {
  id: string;
  cat: string;
  owner: string;
  room: string;
  type: "Check-in" | "Check-out";
  time?: string | null;
  code?: string;
};

type DisplayTask = {
  id: string;
  title: string;
  detail: string;
  icon: typeof Pill;
  color: string;
  badge?: string;
};

type OccupancySeries = {
  values: number[];
  isPercent: boolean;
  average: number;
};

type MonthlyBooking = { month: string; value: number };

export default function AdminDashboardPage() {
  const today = useMemo(() => startOfDay(new Date()), []);
  const {
    data: reservations,
    isLoading: reservationsLoading,
    error: reservationsError,
  } = useReservations();
  const {
    data: staffTasks,
    isLoading: tasksLoading,
    error: tasksError,
  } = useStaffTasks(true);
  const { data: roomTypes, isLoading: roomsLoading } = useRooms(false);

  const summaryCards = useMemo(
    () => buildSummaryCards({ reservations, roomTypes, tasks: staffTasks, today }),
    [reservations, roomTypes, staffTasks, today],
  );
  const todayReservations = useMemo(
    () => buildTodayFlow(reservations, today),
    [reservations, today],
  );
  const overdueTasks = useMemo(
    () => buildOverdueTasks(staffTasks, today),
    [staffTasks, today],
  );
  const occupancy = useMemo(
    () => buildOccupancySeries(reservations, roomTypes),
    [reservations, roomTypes],
  );
  const monthlyBookings = useMemo(
    () => buildMonthlyBookings(reservations),
    [reservations],
  );

  const summaryLoading = reservationsLoading || tasksLoading || roomsLoading;
  const todayLabel = new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    weekday: "long",
  }).format(today);

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.4em] admin-muted">Kontrol Paneli</p>
          <h1 className="mt-2 text-3xl font-semibold">Tekrar hoş geldin, Onur</h1>
          <p className="mt-1 text-sm admin-muted">
            Kedilerin rezervasyonları, oda dolulukları ve operasyon durumları burada birleşiyor.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full border bg-[var(--admin-surface)] px-5 py-2 text-sm font-semibold text-[var(--admin-text-strong)] shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg admin-border"
          >
            <TrendingUp className="h-4 w-4 text-peach-400" aria-hidden />
            Raporu indir
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full bg-peach-400 px-5 py-2 text-sm font-semibold text-white shadow-glow transition hover:-translate-y-0.5"
          >
            Yeni rezervasyon ekle
          </button>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {(summaryLoading ? buildPlaceholderSummaryCards() : summaryCards).map((card) => (
          <article
            key={card.label}
            className={clsx(
              "admin-surface relative p-6",
              card.label === "Geciken görevler" && card.trendDirection === "alert" && "admin-warning-card",
            )}
          >
            <div className="flex items-center justify-between">
              <div className="rounded-2xl bg-[var(--admin-highlight-muted)] p-3 text-peach-400">
                <card.icon className="h-4 w-4" aria-hidden />
              </div>
              <button type="button" aria-label="Kart menüsü">
                <Ellipsis className="h-5 w-5 text-[var(--admin-muted)]" />
              </button>
            </div>
            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.4em] admin-muted">
              {card.label}
            </p>
            <div className="mt-3 flex items-end justify-between">
              <h2 className="text-3xl font-semibold">{card.value}</h2>
              {card.trendDirection === "up" && card.trend && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[var(--admin-highlight-muted)] px-3 py-1 text-xs font-semibold text-peach-500">
                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
                  {card.trend}
                </span>
              )}
              {card.trendDirection === "link" && card.trend && (
                <button type="button" className="text-xs font-semibold text-peach-500 hover:underline">
                  {card.trend} →
                </button>
              )}
              {card.trendDirection === "alert" && card.trend && (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-100/50 px-3 py-1 text-xs font-semibold text-red-500 dark:bg-white/10 dark:text-red-200">
                  <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
                  {card.trend}
                </span>
              )}
            </div>
            <p className="mt-2 text-sm admin-muted">{card.meta}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.8fr_1fr]">
        <article className="admin-surface p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.4em] admin-muted">Bugünün akışı</p>
              <h2 className="mt-1 text-2xl font-semibold">Check-in / Check-out</h2>
              <p className="text-xs admin-muted">{todayLabel}</p>
            </div>
            <button type="button" className="text-sm font-semibold text-peach-400 hover:underline">
              Tüm rezervasyonlar →
            </button>
          </div>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead>
                <tr className="border-b text-[11px] uppercase tracking-[0.4em] admin-muted admin-border">
                  <th className="pb-3 font-semibold">Kedi</th>
                  <th className="pb-3 font-semibold">Sahip</th>
                  <th className="pb-3 font-semibold">Oda</th>
                  <th className="pb-3 font-semibold">Tür</th>
                  <th className="pb-3 font-semibold">Saat</th>
                  <th className="pb-3" />
                </tr>
              </thead>
              <tbody>
                {reservationsLoading &&
                  Array.from({ length: 4 }).map((_, index) => (
                    // eslint-disable-next-line react/no-array-index-key
                    <tr key={index} className="border-b last:border-none admin-border">
                      <td className="py-3">
                        <div className="flex items-center gap-3 font-semibold">
                          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--admin-highlight-muted)] text-peach-500">
                            <Cat className="h-4 w-4" aria-hidden />
                          </span>
                          <span className="h-4 w-24 rounded bg-[var(--admin-surface-alt)]" />
                        </div>
                      </td>
                      <td className="py-3 text-sm admin-muted">
                        <span className="inline-block h-4 w-32 rounded bg-[var(--admin-surface-alt)]" />
                      </td>
                      <td className="py-3 text-sm admin-muted">
                        <span className="inline-block h-4 w-24 rounded bg-[var(--admin-surface-alt)]" />
                      </td>
                      <td className="py-3">
                        <span className="inline-block h-6 w-20 rounded-full bg-[var(--admin-surface-alt)]" />
                      </td>
                      <td className="py-3 text-sm admin-muted">
                        <span className="inline-block h-4 w-12 rounded bg-[var(--admin-surface-alt)]" />
                      </td>
                      <td className="py-3 text-right">
                        <span className="inline-block h-7 w-16 rounded-full bg-[var(--admin-surface-alt)]" />
                      </td>
                    </tr>
                  ))}

                {!reservationsLoading &&
                  todayReservations.map((row, index) => (
                    <tr key={row.id} className="border-b last:border-none admin-border">
                      <td className="py-3">
                        <div className="flex items-center gap-3 font-semibold">
                          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--admin-highlight-muted)] text-peach-500">
                            <Cat className="h-4 w-4" aria-hidden />
                          </span>
                          {row.cat}
                        </div>
                      </td>
                      <td className="py-3 text-sm admin-muted">{row.owner}</td>
                      <td className="py-3 text-sm admin-muted">{row.room}</td>
                      <td className="py-3">
                        <span
                          className={clsx(
                            "rounded-full px-3 py-1 text-xs font-semibold",
                            row.type === "Check-in" ? "admin-badge-checkin" : "admin-badge-checkout",
                          )}
                        >
                          {row.type}
                        </span>
                      </td>
                      <td className="py-3 text-sm admin-muted">{row.time ? formatTimeLabel(row.time) : "—"}</td>
                      <td className="py-3 text-right">
                        <button
                          type="button"
                          className="rounded-full border px-3 py-1 text-xs font-semibold text-[var(--admin-muted)] transition hover:-translate-y-0.5 hover:border-peach-300 hover:text-peach-400 admin-border"
                        >
                          Detay
                        </button>
                      </td>
                    </tr>
                  ))}

                {!reservationsLoading && todayReservations.length === 0 && (
                  <tr>
                    <td className="py-6 text-center text-sm text-[var(--admin-muted)]" colSpan={6}>
                      Bugüne ait check-in veya check-out kaydı yok.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {reservationsError && (
            <p className="mt-4 text-xs font-semibold text-red-500">
              Rezervasyonlar yüklenirken hata: {reservationsError instanceof Error ? reservationsError.message : "Bilinmeyen hata"}
            </p>
          )}
          <p className="mt-4 text-xs font-semibold text-peach-500">
            {todayReservations.length} işlem planlandı. Kapasite eşleştirmeleri otomatik güncellendi
          </p>
        </article>

        <article className="admin-surface flex h-full flex-col gap-4 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.4em] admin-muted">Acil liste</p>
              <h2 className="mt-1 text-xl font-semibold">Geciken görevler</h2>
            </div>
            <button type="button" className="rounded-full border px-3 py-1 text-xs font-semibold admin-border">
              <Filter className="mr-1 inline h-4 w-4" aria-hidden />
              Filtre
            </button>
          </div>
          <div className="space-y-4">
            {tasksLoading &&
              Array.from({ length: 3 }).map((_, index) => (
                // eslint-disable-next-line react/no-array-index-key
                <div key={index} className="flex items-center justify-between rounded-2xl px-4 py-3 admin-soft-surface">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--admin-surface-alt)]" />
                    <div className="space-y-2">
                      <span className="block h-4 w-40 rounded bg-[var(--admin-surface-alt)]" />
                      <span className="block h-3 w-28 rounded bg-[var(--admin-surface-alt)]" />
                    </div>
                  </div>
                  <span className="h-7 w-20 rounded-full bg-[var(--admin-surface-alt)]" />
                </div>
              ))}

            {!tasksLoading &&
              overdueTasks.map((task) => {
                const Icon = task.icon;
                return (
                  <div
                    key={task.id}
                    className="flex items-center justify-between rounded-2xl px-4 py-3 admin-soft-surface"
                  >
                    <div className="flex items-center gap-3">
                      <span className={clsx("flex h-10 w-10 items-center justify-center rounded-2xl text-lg", task.color, "admin-soft-surface")}>
                        <Icon className="h-4 w-4" aria-hidden />
                      </span>
                      <div>
                        <p className="text-sm font-semibold">{task.title}</p>
                        <p className="text-xs admin-muted">{task.detail}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="admin-warning-pill rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.3em]">
                        {task.badge ?? "Gecikti"}
                      </span>
                      <button
                        type="button"
                        className="rounded-full border px-3 py-1 text-xs font-semibold text-[var(--admin-text-strong)] transition hover:-translate-y-0.5 hover:border-peach-300 hover:text-peach-400 admin-border"
                      >
                        Tamamlandı
                      </button>
                    </div>
                  </div>
                );
              })}

            {!tasksLoading && overdueTasks.length === 0 && (
              <div className="rounded-2xl border border-dashed bg-[var(--admin-surface-alt)] px-4 py-6 text-center text-sm font-semibold text-[var(--admin-muted)]">
                Gecikmiş görev bulunmuyor. Planlanan tüm işler zamanında.
              </div>
            )}
          </div>
          {tasksError && (
            <p className="text-xs font-semibold text-red-500">
              Görevler yüklenirken hata: {tasksError instanceof Error ? tasksError.message : "Bilinmeyen hata"}
            </p>
          )}
          <button
            type="button"
            className="mt-auto inline-flex items-center text-sm font-semibold text-peach-400 hover:underline"
          >
            Tüm görevleri görüntüle →
          </button>
        </article>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <article className="admin-surface p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.4em] admin-muted">Doluluk oranı</p>
              <h3 className="mt-1 text-xl font-semibold">Son 7 gün</h3>
            </div>
            <LineChart className="h-5 w-5 text-peach-400" aria-hidden />
          </div>
          <div className="mt-6">
            <div className="flex items-baseline gap-2 text-3xl font-semibold">
              {occupancy.isPercent ? `%${occupancy.average}` : occupancy.average}{" "}
              <span className="text-sm font-medium admin-muted">
                {occupancy.isPercent ? "ortalama" : "aktif rezervasyon ortalaması"}
              </span>
            </div>
            <div className="mt-4 flex items-end gap-2">
              {(occupancy.values.length ? occupancy.values : Array.from({ length: 7 }, () => 0)).map((value, index, arr) => {
                const maxValue = Math.max(...arr, 1);
                const heightPercent = maxValue > 0 ? Math.round((value / maxValue) * 100) : 0;
                return (
                  // eslint-disable-next-line react/no-array-index-key
                  <span
                    key={index}
                    className="h-24 flex-1 rounded-full bg-gradient-to-t from-peach-100 to-peach-300 dark:from-peach-500/20 dark:to-peach-400/60"
                    style={{ height: `${heightPercent}%` }}
                  />
                );
              })}
            </div>
            <p className="mt-3 text-xs admin-muted">
              {occupancy.values.length > 0
                ? "Doluluk son 7 günde güncel verilerden hesaplandı."
                : "Doluluk eğrisi için yeterli rezervasyon bulunamadı."}
            </p>
          </div>
        </article>

        <article className="admin-surface admin-heat-card p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[var(--admin-text-strong)]/70">
            Yaklaşan yoğunluk
          </p>
          <h3 className="mt-2 text-2xl font-semibold text-[var(--admin-text-strong)]">
            Bayram haftası yaklaşırken rezervasyonlar artıyor
          </h3>
          <p className="mt-3 text-sm text-[var(--admin-text-strong)]/80">
            20-24 Aralık tarihleri arasında %95 üzeri doluluk bekleniyor. Oda temizliği ve ekip vardiyalarını şimdiden
            planlayın.
          </p>
          <div className="mt-6 flex items-center gap-3 rounded-2xl bg-white/60 p-3 text-sm font-semibold text-peach-500 admin-soft-surface">
            <TrendingUp className="h-5 w-5" aria-hidden />
            Rezervasyon trendlerini görüntüle →
          </div>
        </article>

        <article className="admin-surface p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.4em] admin-muted">Aylık karşılaştırma</p>
              <h3 className="mt-1 text-xl font-semibold">Rezervasyonlar</h3>
            </div>
            <CalendarCheck2 className="h-5 w-5 text-peach-400" aria-hidden />
          </div>
          <div className="mt-6 space-y-4">
            {(monthlyBookings.length ? monthlyBookings : buildPlaceholderBookings()).map((item, _, arr) => {
              const maxValue = Math.max(...arr.map((entry) => entry.value), 1);
              const widthPercent = maxValue > 0 ? Math.round((item.value / maxValue) * 100) : 0;
              return (
                <div key={`${item.month}-${item.value}`}>
                  <div className="flex items-center justify-between text-sm font-semibold">
                    <span>{item.month}</span>
                    <span className="admin-muted">{item.value} rezervasyon</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-[var(--admin-surface-alt)]">
                    <span
                      className="block h-2 rounded-full bg-gradient-to-r from-peach-400 to-lagoon-500"
                      style={{ width: `${widthPercent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </article>
      </section>
    </div>
  );
}

function buildSummaryCards({
  reservations,
  roomTypes,
  tasks,
  today,
}: {
  reservations?: Reservation[] | null;
  roomTypes?: RoomType[] | null;
  tasks?: CareTask[] | null;
  today: Date;
}): SummaryCard[] {
  const activeStays = getActiveReservations(reservations ?? [], today);
  const occupancySnapshot = calculateOccupancySnapshot(roomTypes ?? [], reservations ?? [], today);
  const uniqueCats = new Set(
    activeStays.flatMap((res) => res.cats?.map((c) => c.cat.id).filter(Boolean) ?? []),
  ).size;
  const { totalUnits, availableUnits, occupiedUnits } = occupancySnapshot;
  const occupancyValue =
    totalUnits > 0 ? `${Math.min(100, Math.round((occupiedUnits / totalUnits) * 100))}%` : `${activeStays.length}`;
  const checkInsToday = (reservations ?? []).filter((res) => isSameDaySafe(res.checkIn, today)).length;
  const checkOutsToday = (reservations ?? []).filter((res) => isSameDaySafe(res.checkOut, today)).length;
  const overdueCount = calculateOverdueCount(tasks ?? [], today);

  return [
    {
      label: "Bugünün doluluğu",
      value: occupancyValue || "—",
      meta:
        totalUnits > 0
          ? `${occupiedUnits} / ${totalUnits} oda dolu`
          : `${activeStays.length} aktif rezervasyon`,
      trend: totalUnits > 0 ? `${availableUnits} oda boşta` : "Güncelleniyor",
      trendDirection: "up",
      icon: DoorOpen,
    },
    {
      label: "Oteldeki kedi sayısı",
      value: String(uniqueCats || 0),
      meta: "Aktif rezervasyonlardaki toplam kedi",
      trend: uniqueCats ? `${uniqueCats} kedi` : "Veri bekleniyor",
      trendDirection: "up",
      icon: Cat,
    },
    {
      label: "Check-in / Check-out",
      value: `${checkInsToday} / ${checkOutsToday}`,
      meta: "Bugünün planı",
      trend: "Rezervasyon listesi",
      trendDirection: "link",
      icon: CalendarCheck2,
    },
    {
      label: "Geciken görevler",
      value: String(overdueCount),
      meta: overdueCount ? "Planlanan süreyi aştı" : "Geciken görev yok",
      trend: overdueCount ? "Uyarı" : "Tüm görevler zamanında",
      trendDirection: overdueCount ? "alert" : "link",
      icon: AlertTriangle,
    },
  ];
}

function buildPlaceholderSummaryCards(): SummaryCard[] {
  return [
    { label: "Bugünün doluluğu", value: "—", meta: "Yükleniyor", trendDirection: "up", icon: DoorOpen },
    { label: "Oteldeki kedi sayısı", value: "—", meta: "Yükleniyor", trendDirection: "up", icon: Cat },
    { label: "Check-in / Check-out", value: "— / —", meta: "Yükleniyor", trendDirection: "link", trend: "Bekleniyor", icon: CalendarCheck2 },
    { label: "Geciken görevler", value: "—", meta: "Yükleniyor", trendDirection: "alert", icon: AlertTriangle },
  ];
}

function buildTodayFlow(reservations: Reservation[] | undefined | null, today: Date): TodayReservationRow[] {
  if (!reservations?.length) return [];
  const rows: TodayReservationRow[] = [];
  reservations.forEach((res) => {
    const customerName = res.customer?.user.name || res.customer?.user.email || "Müşteri bilgisi yok";
    const room = res.roomType?.name || "Oda bilinmiyor";
    const catName = res.cats?.[0]?.cat.name || "Kedi";
    if (isSameDaySafe(res.checkIn, today)) {
      rows.push({
        id: `${res.id}-checkin`,
        cat: catName,
        owner: customerName,
        room,
        type: "Check-in",
        time: res.checkIn,
        code: res.code,
      });
    }
    if (isSameDaySafe(res.checkOut, today)) {
      rows.push({
        id: `${res.id}-checkout`,
        cat: catName,
        owner: customerName,
        room,
        type: "Check-out",
        time: res.checkOut,
        code: res.code,
      });
    }
  });

  return rows.sort((a, b) => (a.time ?? "").localeCompare(b.time ?? ""));
}

function buildOverdueTasks(tasks: CareTask[] | undefined | null, now: Date): DisplayTask[] {
  if (!tasks?.length) return [];
  const metaMap: Record<string, { icon: typeof Pill; color: string; badge: string }> = {
    [CareTaskType.MEDICATION]: { icon: Pill, color: "text-rose-500", badge: "İlaç" },
    [CareTaskType.FEEDING]: { icon: UtensilsCrossed, color: "text-peach-400", badge: "Mama" },
    [CareTaskType.CLEANING]: { icon: BroomIcon, color: "text-lagoon-500", badge: "Temizlik" },
    [CareTaskType.CHECKIN]: { icon: CheckCircle2, color: "text-emerald-500", badge: "Check-in" },
    [CareTaskType.CHECKOUT]: { icon: DoorOpen, color: "text-orange-500", badge: "Check-out" },
  };

  return tasks
    .filter((task) => {
      if (!task.scheduledAt) return false;
      if (task.status === CareTaskStatus.DONE || task.status === CareTaskStatus.CANCELLED) return false;
      const scheduled = new Date(task.scheduledAt);
      return scheduled.getTime() < now.getTime();
    })
    .sort((a, b) => {
      const aTime = new Date(a.scheduledAt ?? "").getTime();
      const bTime = new Date(b.scheduledAt ?? "").getTime();
      return aTime - bTime;
    })
    .map((task) => {
      const meta = metaMap[task.type as string] ?? metaMap[CareTaskType.FEEDING];
      const catName = task.cat?.name || task.reservation?.cats?.[0]?.cat.name;
      const resCode = task.reservation?.code;
      const time = task.scheduledAt ? formatTimeLabel(task.scheduledAt) : null;
      const detailParts = [catName, resCode, time ? `${time} planlı` : null].filter(Boolean);
      return {
        id: task.id,
        title: task.notes || meta.badge,
        detail: detailParts.join(" | ") || "Planlanan saat geçti",
        icon: meta.icon,
        color: meta.color,
        badge: meta.badge,
      };
    });
}

function buildOccupancySeries(reservations?: Reservation[] | null, roomTypes?: RoomType[] | null): OccupancySeries {
  const normalizedRoomTypes = roomTypes ?? [];
  const totalUnits = getTotalUnits(normalizedRoomTypes);
  const end = startOfDay(new Date());
  const start = startOfDay(addDays(end, -6));
  const days = eachDayOfInterval({ start, end });
  const values = days.map((day) => {
    const snapshot = calculateOccupancySnapshot(normalizedRoomTypes, reservations ?? [], day);
    if (totalUnits > 0) {
      return Math.min(100, Math.round((snapshot.occupiedUnits / totalUnits) * 100));
    }
    return snapshot.occupiedUnits;
  });
  const average = values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0;
  return { values, isPercent: totalUnits > 0, average };
}

function buildMonthlyBookings(reservations?: Reservation[] | null): MonthlyBooking[] {
  if (!reservations?.length) return [];
  const buckets = new Map<string, { label: string; count: number; order: number }>();
  reservations.forEach((res) => {
    const checkInDate = safeDate(res.checkIn);
    if (!checkInDate) return;
    const key = `${checkInDate.getFullYear()}-${checkInDate.getMonth() + 1}`;
    const entry = buckets.get(key) ?? {
      label: checkInDate.toLocaleString("tr-TR", { month: "short" }),
      count: 0,
      order: checkInDate.getTime(),
    };
    entry.count += 1;
    buckets.set(key, entry);
  });

  return Array.from(buckets.values())
    .sort((a, b) => a.order - b.order)
    .slice(-4)
    .map((entry) => ({ month: entry.label, value: entry.count }));
}

function buildPlaceholderBookings(): MonthlyBooking[] {
  return [
    { month: "Haz", value: 0 },
    { month: "Tem", value: 0 },
    { month: "Ağu", value: 0 },
    { month: "Eyl", value: 0 },
  ];
}

function calculateOccupancySnapshot(roomTypes: RoomType[], reservations: Reservation[], day: Date) {
  const totalUnits = getTotalUnits(roomTypes);
  const activeReservations = getActiveReservations(reservations, day);

  if (!totalUnits) {
    return {
      totalUnits: 0,
      occupiedUnits: activeReservations.length,
      availableUnits: 0,
    };
  }

  let occupiedUnits = 0;
  let availableUnits = 0;

  roomTypes.forEach((type) => {
    const units = Math.max(0, type.totalUnits ?? 0);
    if (!units) return;
    const capacity = Math.max(1, type.capacity ?? 1);
    const overbookingLimit = Math.max(0, type.overbookingLimit ?? 0);
    const totalSlots = (units + overbookingLimit) * capacity;
    const reservationsForType = activeReservations.filter((res) => res.roomType?.id === type.id);
    if (!reservationsForType.length) {
      availableUnits += units;
      return;
    }

    const assignedRoomIds = new Set<string>();
    const fallbackReservations: Reservation[] = [];
    reservationsForType.forEach((res) => {
      const rawRoomId = res.checkInForm?.roomId;
      const roomId = typeof rawRoomId === "string" ? rawRoomId.trim() : "";
      if (roomId) {
        assignedRoomIds.add(roomId);
      } else {
        fallbackReservations.push(res);
      }
    });

    const assignedUnits = Math.min(assignedRoomIds.size, units);
    const usedSlotsByAssigned = assignedUnits * capacity;
    const remainingSlots = Math.max(0, totalSlots - usedSlotsByAssigned);
    const fallbackSlots = fallbackReservations.reduce(
      (sum, reservation) => sum + resolveReservationSlots(reservation, capacity),
      0,
    );
    const totalSlotsUsed = usedSlotsByAssigned + Math.min(fallbackSlots, remainingSlots);
    const effectiveOccupiedUnits = Math.min(units, Math.ceil(totalSlotsUsed / capacity));
    const freeUnits = Math.max(0, units - effectiveOccupiedUnits);

    availableUnits += freeUnits;
    occupiedUnits += effectiveOccupiedUnits;
  });

  return { totalUnits, occupiedUnits, availableUnits };
}

function resolveReservationSlots(reservation: Reservation, capacity: number) {
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

function getActiveReservations(reservations: Reservation[], day: Date) {
  const dayStart = startOfDay(day);
  return reservations.filter((res) => {
    if (res.status !== ReservationStatus.CHECKED_IN) return false;
    const checkIn = safeDate(res.checkIn);
    const checkOut = safeDate(res.checkOut);
    if (!checkIn || !checkOut) return false;
    const checkInDay = startOfDay(checkIn);
    const checkOutDay = startOfDay(checkOut);
    return checkInDay.getTime() <= dayStart.getTime() && dayStart.getTime() < checkOutDay.getTime();
  });
}

function calculateOverdueCount(tasks: CareTask[], now: Date) {
  return tasks.filter((task) => {
    if (!task.scheduledAt) return false;
    if (task.status === CareTaskStatus.DONE || task.status === CareTaskStatus.CANCELLED) return false;
    const scheduled = new Date(task.scheduledAt);
    return scheduled.getTime() < now.getTime();
  }).length;
}

function getTotalUnits(roomTypes: RoomType[]) {
  if (!roomTypes.length) return 0;
  return roomTypes.reduce((sum, type) => {
    if (typeof type.totalUnits === "number") return sum + Math.max(0, type.totalUnits);
    return sum;
  }, 0);
}

function isSameDaySafe(value: string | undefined, day: Date) {
  if (!value) return false;
  const parsed = safeDate(value);
  if (!parsed) return false;
  return isSameDay(parsed, day);
}

function safeDate(value?: string | null) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatTimeLabel(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
}

const BroomIcon = forwardRef<SVGSVGElement, SVGProps<SVGSVGElement>>(function BroomIcon(
  props,
  ref,
) {
  return (
    <svg
      ref={ref}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M2 22h20" />
      <path d="M5 21v-5l7-7 7 7v5" />
      <path d="M9 11l6 6" />
      <path d="M12 8l5-5" />
    </svg>
  );
});
