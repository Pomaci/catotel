"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ClipboardList, CheckCircle2 } from "lucide-react";
import { StatusBanner } from "@/components/ui/StatusBanner";
import { useReservations, useStaffTasks, useUpdateTaskStatus } from "@/lib/hooks/useHotelData";
import { buildReservationTasks } from "@/lib/tasks/reservation-tasks";
import { CareTaskStatus, CareTaskType } from "@/types/enums";

export default function TasksPage() {
  const { data: tasks, isLoading, error } = useStaffTasks(true);
  const {
    data: reservations,
    isLoading: reservationsLoading,
    error: reservationsError,
  } = useReservations();
  const updateTask = useUpdateTaskStatus();
  const reservationTasks = useMemo(
    () => buildReservationTasks(reservations ?? []),
    [reservations],
  );
  const hasTasks = (tasks?.length ?? 0) > 0 || reservationTasks.length > 0;
  const isBusy = isLoading || reservationsLoading;

  const handleAdvance = (id: string, status: CareTaskStatus) => {
    const next = status === CareTaskStatus.OPEN ? CareTaskStatus.IN_PROGRESS : CareTaskStatus.DONE;
    updateTask.mutate({ id, payload: { status: next } });
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--admin-highlight-muted)] text-peach-500">
          <ClipboardList className="h-5 w-5" aria-hidden />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--admin-muted)]">Operasyon</p>
          <h1 className="text-2xl font-semibold text-[var(--admin-text-strong)]">Gorev Yonetimi</h1>
          <p className="text-sm text-[var(--admin-muted)]">Check-in/Check-out gorevlerini goruntule ve durumunu guncelle.</p>
        </div>
      </header>

      {error && <StatusBanner variant="error">{String(error)}</StatusBanner>}
      {reservationsError && <StatusBanner variant="error">{String(reservationsError)}</StatusBanner>}

      <div className="admin-surface p-4">
        {isBusy && <p className="text-sm text-[var(--admin-muted)]">Gorevler yukleniyor...</p>}
        {!isBusy && !hasTasks && (
          <p className="text-sm text-[var(--admin-muted)]">Goruntulenecek gorev bulunamadi.</p>
        )}
        <div className="space-y-2">
          {(tasks ?? []).map((task) => (
            <div
              key={task.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-[var(--admin-surface-alt)] px-3 py-2 admin-border"
            >
              <div>
                <p className="text-sm font-semibold text-[var(--admin-text-strong)]">{formatTask(task.type)}</p>
                <p className="text-[11px] text-[var(--admin-muted)]">{task.notes ?? "Not yok"}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-[var(--admin-highlight-muted)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--admin-text-strong)]">
                  {task.status}
                </span>
                {task.status !== CareTaskStatus.DONE && (
                  <button
                    type="button"
                    onClick={() => handleAdvance(task.id, task.status as CareTaskStatus)}
                    className="inline-flex items-center gap-1 rounded-full bg-peach-400 px-3 py-1 text-xs font-semibold text-white shadow-glow transition hover:-translate-y-0.5 disabled:opacity-60"
                    disabled={updateTask.isPending}
                  >
                    {task.status === CareTaskStatus.OPEN ? "Baslat" : "Tamamla"}
                    <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                  </button>
                )}
              </div>
            </div>
          ))}
          {reservationTasks.map((task) => (
            <div
              key={task.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-[var(--admin-surface-alt)] px-3 py-2 admin-border"
            >
              <div>
                <p className="text-sm font-semibold text-[var(--admin-text-strong)]">{task.title}</p>
                <p className="text-[11px] text-[var(--admin-muted)]">{task.detail || "Detay yok"}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-[var(--admin-highlight-muted)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--admin-text-strong)]">
                  PLANLI
                </span>
                <Link
                  href={`/dashboard/reservations/${task.reservationId}`}
                  className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold text-[var(--admin-text-strong)] transition hover:-translate-y-0.5 hover:border-peach-300 hover:text-peach-500 admin-border"
                >
                  Detay
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function formatTask(type: CareTaskType | string) {
  if (type === CareTaskType.CHECKIN) return "Check-in";
  if (type === CareTaskType.CHECKOUT) return "Check-out";
  return String(type).toLowerCase();
}
