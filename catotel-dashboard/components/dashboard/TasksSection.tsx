"use client";

import {
  CareTaskStatus,
  type CareTaskStatus as CareTaskStatusValue,
} from "@/types/enums";
import type { CareTask } from "@/types/hotel";
import { formatDate, formatEnum } from "@/lib/utils/format";
import { Button } from "@/components/Button";

const statusColumns: CareTaskStatusValue[] = [
  CareTaskStatus.OPEN,
  CareTaskStatus.IN_PROGRESS,
  CareTaskStatus.DONE,
  CareTaskStatus.CANCELLED,
];

export function TasksSection({
  tasks,
  onUpdate,
}: {
  tasks: CareTask[] | undefined;
  onUpdate(
    id: string,
    payload: { status: CareTaskStatusValue; notes?: string },
  ): Promise<void>;
}) {
  return (
    <section className="surface-card space-y-6">
      <header>
        <h2 className="text-2xl font-semibold text-cocoa-700">Bakım görevleri</h2>
        <p className="text-sm text-slate-500">
          Personel görev durumlarını kartlardan güncelleyebilir.
        </p>
      </header>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statusColumns.map((status) => (
          <div
            key={status}
            className="rounded-3xl border border-sand-200 bg-white/90 p-4 shadow-sm"
          >
            <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
              {formatEnum(status)}
            </h3>
            <div className="mt-2 space-y-3">
              {tasks
                ?.filter((task) => task.status === status)
                .map((task) => (
                  <TaskCard key={task.id} task={task} onUpdate={onUpdate} />
                ))}
              {tasks?.filter((task) => task.status === status).length ===
                0 && (
                <p className="rounded-2xl border border-dashed border-sand-200 px-3 py-2 text-xs text-slate-400">
                  Henüz görev yok.
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function TaskCard({
  task,
  onUpdate,
}: {
  task: CareTask;
  onUpdate(
    id: string,
    payload: { status: CareTaskStatusValue },
  ): Promise<void>;
}) {
  return (
    <div className="rounded-2xl border border-sand-200 bg-white/80 p-3 text-sm text-cocoa-700">
      <p className="font-semibold">{formatEnum(task.type)}</p>
      <p className="text-xs text-slate-500">
        {task.cat?.name ?? "Belirtilmedi"} ·{" "}
        {task.reservation?.room.name ?? "Oda yok"}
      </p>
      <p className="mt-2 text-xs text-slate-500">
        Planlanan: {formatDate(task.scheduledAt, { dateStyle: "medium" })}
      </p>
      <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
        {[CareTaskStatus.IN_PROGRESS, CareTaskStatus.DONE].map((newStatus) => (
          <Button
            key={newStatus}
            type="button"
            variant="ghost"
            className="text-xs"
            onClick={() => onUpdate(task.id, { status: newStatus })}
          >
            {formatEnum(newStatus)}
          </Button>
        ))}
      </div>
    </div>
  );
}

