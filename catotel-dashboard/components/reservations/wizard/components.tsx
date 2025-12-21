import clsx from "clsx";
import { Check } from "lucide-react";
import type { ReactNode } from "react";

import type { ReservationRoomAssignment } from "@/types/hotel";

import { compactDate } from "./utils";
import { stepOrder, type StepKey } from "./types";

export function StepCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--admin-border)] bg-[var(--admin-surface-alt)] p-4">
      <p className="text-sm font-semibold text-[var(--admin-text-strong)]">{title}</p>
      <div className="mt-3 space-y-3">{children}</div>
    </div>
  );
}

export function SummaryStat({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description?: string;
}) {
  return (
    <div className="rounded-2xl border bg-[var(--admin-surface)] p-3 admin-border">
      <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[var(--admin-muted)]">
        {label}
      </p>
      <p className="text-sm font-semibold text-[var(--admin-text-strong)]">{value}</p>
      {description && <p className="text-xs text-[var(--admin-muted)]">{description}</p>}
    </div>
  );
}

export function RoomAssignmentSummary({
  assignments,
}: {
  assignments?: ReservationRoomAssignment[] | null;
}) {
  const hasAssignments = Boolean(assignments && assignments.length > 0);
  return (
    <div className="mt-4 rounded-2xl border border-dashed bg-[var(--admin-surface-alt)] p-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-[var(--admin-text-strong)]">Mevcut oda ataması</p>
          <p className="text-xs text-[var(--admin-muted)]">
            Kaydettiğinde sistem oda planlamasını otomatik günceller.
          </p>
        </div>
        {hasAssignments && (
          <span className="admin-chip">
            {assignments?.some((assignment) => assignment.lockedAt) ? "Kilitli odalar" : "Plan aşamasında"}
          </span>
        )}
      </div>
      {hasAssignments ? (
        <ul className="mt-3 space-y-2">
          {assignments!.map((assignment) => (
            <li
              key={assignment.id}
              className="flex flex-col gap-2 rounded-2xl border bg-[var(--admin-surface)] px-3 py-2 text-sm font-semibold text-[var(--admin-text-strong)] admin-border sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p>{assignment.room.name}</p>
                <p className="text-xs font-semibold text-[var(--admin-muted)]">
                  {compactDate(assignment.checkIn)} {"→"} {compactDate(assignment.checkOut)}
                </p>
              </div>
              <div className="text-xs font-semibold text-[var(--admin-muted)] sm:text-right">
                <span
                  className={clsx(
                    "inline-flex items-center gap-2 rounded-full px-2 py-0.5 text-[11px]",
                    assignment.lockedAt ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700",
                  )}
                >
                  {assignment.lockedAt ? "Kilitli" : "Planlandı"}
                </span>
                <p className="mt-1">
                  {assignment.catCount} kedi · {assignment.allowRoomSharing ? "Paylaşımlı" : "Özel"}
                </p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-xs font-semibold text-[var(--admin-muted)]">
          Henüz oda ataması yapılmadı. Rezervasyonu kaydettiğinizde uygun oda otomatik seçilir.
        </p>
      )}
    </div>
  );
}

export function Field({
  icon,
  placeholder,
  value,
  onChange,
  min,
  type = "text",
}: {
  icon: ReactNode;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  min?: string;
  type?: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-2xl border bg-[var(--admin-surface)] px-3 py-2 admin-border">
      {icon}
      <input
        type={type}
        placeholder={placeholder}
        className="w-full bg-transparent text-sm text-[var(--admin-text-strong)] placeholder:text-[var(--admin-muted)] focus:outline-none"
        value={value}
        min={min}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

export function Line({
  label,
  value,
  variant = "default",
}: {
  label: string;
  value: string;
  variant?: "default" | "discount" | "total";
}) {
  return (
    <div
      className={clsx(
        "flex items-center justify-between text-sm font-semibold",
        variant === "discount" && "text-emerald-600",
        variant === "total" && "text-base",
      )}
    >
      <span
        className={clsx(
          "text-[var(--admin-muted)]",
          variant !== "default" && "text-[var(--admin-text-strong)]",
          variant === "discount" && "text-emerald-600",
        )}
      >
        {label}
      </span>
      <span
        className={clsx(
          "text-[var(--admin-text-strong)]",
          variant === "discount" && "text-emerald-600",
          variant === "total" && "text-2xl",
        )}
      >
        {value}
      </span>
    </div>
  );
}

export function Stepper({ current }: { current: StepKey }) {
  return (
    <div className="wizard-steps">
      {stepOrder.map((key, idx) => {
        const state = idx < stepOrder.indexOf(current) ? "done" : idx === stepOrder.indexOf(current) ? "active" : "pending";
        return (
          <div key={key} className="wizard-steps__item">
            <div className={clsx("wizard-steps__node", state)}>
              {state === "done" ? <Check className="h-4 w-4" aria-hidden /> : idx + 1}
            </div>
            <div className="wizard-steps__label">
              {key === "customer" && "Müşteri"}
              {key === "cats" && "Kedi Seç"}
              {key === "dates" && "Tarih & Oda"}
              {key === "pricing" && "Fiyat & Onay"}
            </div>
          </div>
        );
      })}
    </div>
  );
}
