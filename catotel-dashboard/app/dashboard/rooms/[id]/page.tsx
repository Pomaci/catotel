"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  DoorOpen,
  Edit2,
  Home,
  Info,
  MoreHorizontal,
  PawPrint,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";

type RoomStatus = "ACTIVE" | "INACTIVE";
type RoomType = "Standart" | "Deluxe" | "Suit" | "Büyük Oda" | "Özel Oda";
type ReservationStatus = "CONFIRMED" | "CHECKED_IN" | "CHECKED_OUT" | "CANCELLED";
type NoteCategory = "Temizlik" | "Bakım" | "Uyarı" | "Tamir";

type RoomDetail = {
  id: string;
  name: string;
  type: RoomType;
  capacity: number;
  status: RoomStatus;
  description?: string;
  lastServiced?: string;
};

type RoomReservation = {
  id: string;
  catName: string;
  customerName: string;
  from: string;
  to: string;
  status: ReservationStatus;
};

type RoomNote = {
  id: string;
  title: string;
  body: string;
  category: NoteCategory;
  createdBy: string;
  createdAt: string;
};

const room: RoomDetail = {
  id: "room-204",
  name: "Deluxe 204",
  type: "Deluxe",
  capacity: 2,
  status: "ACTIVE",
  description: "Geniş minder, cam kenarı güneş alan bölüm ve tırmalama alanı içerir.",
  lastServiced: "02 Aralık 2025",
};

const initialReservations: RoomReservation[] = [
  {
    id: "res-101",
    catName: "Minnoş",
    customerName: "Ayşe Yılmaz",
    from: "2025-12-01",
    to: "2025-12-04",
    status: "CHECKED_IN",
  },
  {
    id: "res-102",
    catName: "Zorro",
    customerName: "Mert Aksoy",
    from: "2025-12-04",
    to: "2025-12-07",
    status: "CONFIRMED",
  },
  {
    id: "res-103",
    catName: "Pati",
    customerName: "Melis K.",
    from: "2025-12-07",
    to: "2025-12-09",
    status: "CHECKED_OUT",
  },
  {
    id: "res-104",
    catName: "Mırmır",
    customerName: "Can Yılmaz",
    from: "2025-12-02",
    to: "2025-12-03",
    status: "CANCELLED",
  },
];

const initialNotes: RoomNote[] = [
  {
    id: "note-1",
    title: "Haftalık derin temizlik",
    body: "Pencereler, tırmalama kulesi ve minderler dezenfekte edilecek.",
    category: "Temizlik",
    createdBy: "Seda",
    createdAt: "28 Kasım 2025",
  },
  {
    id: "note-2",
    title: "Koku giderici yenilendi",
    body: "Lavanta bazlı koku giderici kullanıldı, alerjen riski yok.",
    category: "Bakım",
    createdBy: "Onur",
    createdAt: "30 Kasım 2025",
  },
  {
    id: "note-3",
    title: "Cam kilidi kontrolü",
    body: "Sağdaki pencere kilidi için gevşeklik tespit edildi, tamir planlandı.",
    category: "Tamir",
    createdBy: "Gamze",
    createdAt: "01 Aralık 2025",
  },
];

export default function RoomDetailPage() {
  const router = useRouter();
  const [startDate, setStartDate] = useState(() => startOfWeek(new Date(), 1));
  const [notes, setNotes] = useState<RoomNote[]>(initialNotes);
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [noteDraft, setNoteDraft] = useState<{ title: string; body: string; category: NoteCategory }>({
    title: "",
    body: "",
    category: "Temizlik",
  });

  const windowDays = 7;
  const timelineDays = useMemo(() => {
    return Array.from({ length: windowDays }, (_, index) => addDays(startDate, index));
  }, [startDate]);

  const reservations = useMemo(() => initialReservations, []);
  const visibleReservations = reservations
    .map((res) => buildTimelinePlacement(res, startDate, windowDays))
    .filter((item) => item !== null) as Array<ReturnType<typeof buildTimelinePlacement> & { reservation: RoomReservation }>;

  const handleNoteSubmit = () => {
    if (!noteDraft.title.trim() || !noteDraft.body.trim()) return;
    const newNote: RoomNote = {
      id: `note-${Date.now()}`,
      title: noteDraft.title.trim(),
      body: noteDraft.body.trim(),
      category: noteDraft.category,
      createdBy: "Sistem",
      createdAt: new Date().toLocaleDateString("tr-TR"),
    };
    setNotes((current) => [newNote, ...current]);
    setNoteDraft({ title: "", body: "", category: "Temizlik" });
    setNoteModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <HeaderCard room={room} onEdit={() => router.push(`/dashboard/rooms/${room.id}/edit`)} />

      <section className="admin-surface space-y-4 p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] admin-muted">Doluluk Takvimi</p>
            <h2 className="text-xl font-semibold text-[var(--admin-text-strong)]">7 Günlük Timeline</h2>
            <p className="text-xs admin-muted">Rezervasyon bloklarını takip edin, bugünü ince turuncu çizgi gösterir.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
            <Legend />
            <div className="flex items-center gap-2 rounded-full border bg-[var(--admin-surface-alt)] px-3 py-1 admin-border">
              <button
                type="button"
                className="rounded-full p-1 text-[var(--admin-muted)] transition hover:text-peach-500"
                onClick={() => setStartDate((prev) => addDays(prev, -windowDays))}
                aria-label="Önceki 7 gün"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden />
              </button>
              <span className="text-[var(--admin-text-strong)]">
                {formatDate(timelineDays[0])} – {formatDate(timelineDays[timelineDays.length - 1])}
              </span>
              <button
                type="button"
                className="rounded-full p-1 text-[var(--admin-muted)] transition hover:text-peach-500"
                onClick={() => setStartDate((prev) => addDays(prev, windowDays))}
                aria-label="Sonraki 7 gün"
              >
                <ArrowRight className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </div>
        </div>

        <div className="relative overflow-x-auto rounded-2xl border bg-[var(--admin-surface-alt)] p-4 admin-border">
          <div className="grid grid-cols-7 gap-3 text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--admin-muted)]">
            {timelineDays.map((day) => (
              <div key={day.toISOString()} className="flex flex-col items-center gap-1">
                <span>{formatDay(day)}</span>
                <span className="text-sm text-[var(--admin-text-strong)]">{day.getDate()}</span>
              </div>
            ))}
          </div>

          <div className="relative mt-4 h-[220px] overflow-x-auto rounded-2xl bg-[var(--admin-surface)] p-4 admin-border">
            <TimelineGrid days={windowDays} />
            <TodayMarker startDate={timelineDays[0]} days={windowDays} />
            <div className="grid h-full grid-cols-7 gap-3">
              {visibleReservations.map((item) => (
                <ReservationBlock key={item.reservation.id} {...item} />
              ))}
            </div>
          </div>
        </div>
      </section>

      <NotesSection
        notes={notes}
        onDelete={(id) => setNotes((current) => current.filter((note) => note.id !== id))}
        onEdit={(id) => {
          const found = notes.find((n) => n.id === id);
          if (found) {
            setNoteDraft({ title: found.title, body: found.body, category: found.category });
            setNoteModalOpen(true);
          }
        }}
        onCreate={() => setNoteModalOpen(true)}
      />

      {noteModalOpen && (
        <NoteModal
          draft={noteDraft}
          onChange={setNoteDraft}
          onClose={() => {
            setNoteModalOpen(false);
            setNoteDraft({ title: "", body: "", category: "Temizlik" });
          }}
          onSubmit={handleNoteSubmit}
        />
      )}
    </div>
  );
}

function HeaderCard({ room, onEdit }: { room: RoomDetail; onEdit: () => void }) {
  return (
    <section className="admin-surface p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--admin-highlight)] text-peach-500">
            <DoorOpen className="h-5 w-5" aria-hidden />
          </div>
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-3xl font-semibold text-[var(--admin-text-strong)]">{room.name}</h1>
              <RoomTypeBadge type={room.type} />
              <RoomStatus status={room.status} />
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm font-semibold text-[var(--admin-muted)]">
              <span className="inline-flex items-center gap-2 rounded-full bg-[var(--admin-surface-alt)] px-3 py-1 admin-border">
                <PawPrint className="h-4 w-4 text-peach-400" aria-hidden />
                Kapasite: {room.capacity} kedi
              </span>
              {room.lastServiced && (
                <span className="inline-flex items-center gap-2 rounded-full bg-[var(--admin-surface-alt)] px-3 py-1 admin-border">
                  <Info className="h-4 w-4 text-[var(--admin-muted)]" aria-hidden />
                  Son bakım tarihi: {room.lastServiced}
                </span>
              )}
            </div>
            <p className="max-w-3xl text-sm leading-relaxed text-[var(--admin-muted)]">
              {room.description ?? "Oda açıklaması eklenmemiş."}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center gap-2 rounded-full border bg-[var(--admin-surface-alt)] px-4 py-2 text-sm font-semibold text-[var(--admin-text-strong)] transition hover:-translate-y-0.5 hover:border-peach-300 hover:text-peach-500 admin-border"
          >
            <Edit2 className="h-4 w-4" aria-hidden />
            Düzenle
          </button>
          <StatusToggle status={room.status} />
          <ActionMenu />
        </div>
      </div>
    </section>
  );
}

function Legend() {
  const items: Array<{ label: string; color: string }> = [
    { label: "Onaylı", color: "bg-blue-500" },
    { label: "Check-in", color: "bg-emerald-500" },
    { label: "Check-out", color: "bg-orange-400" },
    { label: "İptal", color: "bg-slate-400" },
  ];
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-full border bg-[var(--admin-surface-alt)] px-3 py-1 admin-border">
      {items.map((item) => (
        <span key={item.label} className="inline-flex items-center gap-1 text-[var(--admin-muted)]">
          <span className={clsx("h-2.5 w-2.5 rounded-full", item.color)} aria-hidden />
          {item.label}
        </span>
      ))}
    </div>
  );
}

function TimelineGrid({ days }: { days: number }) {
  return (
    <div className="pointer-events-none absolute inset-0 grid grid-cols-7 gap-3">
      {Array.from({ length: days }).map((_, index) => (
        <div
          // eslint-disable-next-line react/no-array-index-key
          key={index}
          className="border-l border-dashed border-[var(--admin-border)] first:border-l-0"
        />
      ))}
    </div>
  );
}

function TodayMarker({ startDate, days }: { startDate: Date; days: number }) {
  const today = new Date();
  const start = startOfDay(startDate);
  const end = startOfDay(addDays(startDate, days));
  if (today < start || today > end) return null;
  const offset = Math.min(days - 0.1, Math.max(0, differenceInDays(today, start)));
  return (
    <div
      className="pointer-events-none absolute inset-y-0"
      style={{ left: `calc(${(offset / days) * 100}% + ${offset * 0.75}rem)` }}
    >
      <div className="h-full w-[2px] bg-orange-400/70" />
    </div>
  );
}

function ReservationBlock({
  reservation,
  gridStart,
  span,
}: {
  reservation: RoomReservation;
  gridStart: number;
  span: number;
}) {
  const router = useRouter();
  const statusClasses: Record<ReservationStatus, string> = {
    CONFIRMED: "bg-blue-500/85 text-white",
    CHECKED_IN: "bg-emerald-500/85 text-white",
    CHECKED_OUT: "bg-orange-400/90 text-white",
    CANCELLED: "bg-slate-400/60 text-slate-900 border-2 border-dashed border-slate-500/50",
  };
  return (
    <button
      type="button"
      className={clsx(
        "group relative flex items-center gap-3 overflow-hidden rounded-xl px-3 py-2 text-left shadow-sm transition hover:-translate-y-[1px] hover:shadow-md",
        statusClasses[reservation.status],
      )}
      style={{ gridColumn: `${gridStart} / span ${span}` }}
      onClick={() => router.push(`/dashboard/reservations/${reservation.id}`)}
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white shadow-inner">
        <Home className="h-4 w-4" aria-hidden />
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{reservation.catName}</p>
        <p className="truncate text-xs opacity-80">{reservation.customerName}</p>
        <p className="text-[11px] font-semibold opacity-70">
          {compactDate(reservation.from)} – {compactDate(reservation.to)}
        </p>
      </div>
      <span className="absolute inset-0 rounded-xl border border-white/20 opacity-0 transition group-hover:opacity-100" />
    </button>
  );
}

function NotesSection({
  notes,
  onDelete,
  onEdit,
  onCreate,
}: {
  notes: RoomNote[];
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
  onCreate: () => void;
}) {
  return (
    <section className="admin-surface space-y-4 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] admin-muted">Operasyon Notları</p>
          <h2 className="text-xl font-semibold text-[var(--admin-text-strong)]">Oda Notları</h2>
          <p className="text-xs admin-muted">Temizlik, bakım ve özel durum kayıtları.</p>
        </div>
        <button
          type="button"
          onClick={onCreate}
          className="inline-flex items-center gap-2 rounded-full border bg-[var(--admin-surface-alt)] px-4 py-2 text-sm font-semibold text-[var(--admin-text-strong)] transition hover:-translate-y-0.5 hover:border-peach-300 hover:text-peach-500 admin-border"
        >
          Yeni Not Ekle
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {notes.map((note) => (
          <article
            key={note.id}
            className="relative rounded-2xl border bg-[var(--admin-surface-alt)] p-4 shadow-sm admin-border"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2">
                <span className={clsx("inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold", badgeColor(note.category))}>
                  {note.category}
                </span>
                <h3 className="text-base font-semibold text-[var(--admin-text-strong)]">{note.title}</h3>
                <p className="text-sm leading-relaxed text-[var(--admin-muted)]">{note.body}</p>
              </div>
              <div className="flex items-center gap-2 text-[var(--admin-muted)]">
                <button
                  type="button"
                  className="rounded-full p-1 transition hover:text-peach-500"
                  onClick={() => onEdit(note.id)}
                  aria-label="Düzenle"
                >
                  <Edit2 className="h-4 w-4" aria-hidden />
                </button>
                <button
                  type="button"
                  className="rounded-full p-1 transition hover:text-red-500"
                  onClick={() => onDelete(note.id)}
                  aria-label="Sil"
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                </button>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs font-semibold text-[var(--admin-muted)]">
              <span>{note.createdBy}</span>
              <span>{note.createdAt}</span>
            </div>
          </article>
        ))}
        {notes.length === 0 && (
          <div className="rounded-2xl border bg-[var(--admin-surface-alt)] p-6 text-center text-sm font-semibold text-[var(--admin-muted)] admin-border">
            Henüz not yok.
          </div>
        )}
      </div>
    </section>
  );
}

function NoteModal({
  draft,
  onChange,
  onClose,
  onSubmit,
}: {
  draft: { title: string; body: string; category: NoteCategory };
  onChange: (draft: { title: string; body: string; category: NoteCategory }) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-8 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-3xl border bg-[var(--admin-surface)] p-6 shadow-2xl admin-border">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] admin-muted">Yeni Not</p>
            <h3 className="mt-1 text-2xl font-semibold text-[var(--admin-text-strong)]">Not Ekle</h3>
            <p className="text-sm admin-muted">Kategori seç, kısa açıklama yaz ve kaydet.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-[var(--admin-muted)] transition hover:bg-[var(--admin-surface-alt)] hover:text-peach-500"
            aria-label="Kapat"
          >
            <Trash2 className="hidden" aria-hidden /> {/* spacer to keep height */}
            <span className="sr-only">Kapat</span>
            <svg className="h-5 w-5 text-[var(--admin-muted)]" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M6 6l12 12M18 6 6 18"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <label className="flex flex-col gap-1 text-sm font-semibold text-[var(--admin-text-strong)]">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] admin-muted">Kategori</span>
            <select
              value={draft.category}
              onChange={(e) => onChange({ ...draft, category: e.target.value as NoteCategory })}
              className="rounded-2xl border bg-[var(--admin-surface-alt)] px-3 py-2 text-sm font-semibold text-[var(--admin-text-strong)] shadow-inner transition focus:border-peach-300 focus:outline-none focus:ring-2 focus:ring-peach-100 admin-border"
            >
              {(["Temizlik", "Bakım", "Uyarı", "Tamir"] as NoteCategory[]).map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm font-semibold text-[var(--admin-text-strong)]">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] admin-muted">Başlık</span>
            <input
              value={draft.title}
              onChange={(e) => onChange({ ...draft, title: e.target.value })}
              placeholder="Başlık"
              className="rounded-2xl border bg-[var(--admin-surface-alt)] px-3 py-2 text-sm font-semibold text-[var(--admin-text-strong)] shadow-inner transition focus:border-peach-300 focus:outline-none focus:ring-2 focus:ring-peach-100 admin-border"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-semibold text-[var(--admin-text-strong)]">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] admin-muted">Açıklama</span>
            <textarea
              value={draft.body}
              onChange={(e) => onChange({ ...draft, body: e.target.value })}
              placeholder="Temizlik gereksinimi, bakım notu veya özel durum..."
              rows={4}
              className="rounded-2xl border bg-[var(--admin-surface-alt)] px-3 py-3 text-sm font-medium text-[var(--admin-text-strong)] shadow-inner transition focus:border-peach-300 focus:outline-none focus:ring-2 focus:ring-peach-100 admin-border"
            />
          </label>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full px-4 py-2 text-sm font-semibold text-[var(--admin-muted)] transition hover:text-peach-500"
            >
              İptal
            </button>
            <button
              type="button"
              onClick={onSubmit}
              className="inline-flex items-center gap-2 rounded-full bg-peach-400 px-5 py-2.5 text-sm font-semibold text-white shadow-glow transition hover:-translate-y-0.5"
            >
              Kaydet
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function RoomTypeBadge({ type }: { type: RoomType }) {
  const variant =
    type === "Standart"
      ? "standard"
      : type === "Deluxe"
        ? "deluxe"
        : type === "Suit"
          ? "suite"
          : type === "Büyük Oda"
            ? "large"
            : "special";

  return (
    <span className="room-type-pill capitalize" data-variant={variant}>
      {type}
    </span>
  );
}

function RoomStatus({ status }: { status: RoomStatus }) {
  return (
    <span className="room-status-pill" data-status={status === "ACTIVE" ? "active" : "inactive"}>
      <span
        className={clsx(
          "h-2.5 w-2.5 rounded-full",
          status === "ACTIVE" ? "bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.18)]" : "bg-slate-400",
        )}
        aria-hidden
      />
      {status === "ACTIVE" ? "Aktif" : "Pasif"}
    </span>
  );
}

function StatusToggle({ status }: { status: RoomStatus }) {
  const active = status === "ACTIVE";
  return (
    <button
      type="button"
      className={clsx(
        "relative h-10 w-16 rounded-full border px-1 transition admin-border",
        active ? "bg-peach-400/80" : "bg-[var(--admin-surface-alt)]",
      )}
      aria-pressed={active}
      aria-label="Oda durumunu değiştir"
    >
      <span
        className={clsx(
          "absolute top-1 flex h-8 w-8 items-center justify-center rounded-full bg-white text-[var(--admin-muted)] shadow-sm transition",
          active ? "translate-x-7 text-peach-500" : "translate-x-0",
        )}
      >
        {active ? <CheckCircle2 className="h-4 w-4" aria-hidden /> : <ArrowLeft className="h-4 w-4" aria-hidden />}
      </span>
    </button>
  );
}

function ActionMenu() {
  return (
    <div className="relative">
      <button
        type="button"
        className="rounded-full border bg-[var(--admin-surface-alt)] p-2 text-[var(--admin-muted)] transition hover:-translate-y-0.5 hover:border-peach-300 hover:text-peach-500 admin-border"
        aria-label="İşlemler"
      >
        <MoreHorizontal className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}

function badgeColor(category: NoteCategory) {
  if (category === "Temizlik") return "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-100";
  if (category === "Bakım") return "bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-900/20 dark:text-orange-100";
  if (category === "Uyarı") return "bg-red-50 text-red-600 border border-red-200 dark:bg-red-900/20 dark:text-red-100";
  return "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-100";
}

function compactDate(value: string) {
  const d = new Date(value);
  return d.toLocaleDateString("tr-TR", { day: "2-digit", month: "short" });
}

function formatDate(value: Date) {
  return value.toLocaleDateString("tr-TR", { day: "2-digit", month: "short" });
}

function formatDay(value: Date) {
  return value.toLocaleDateString("tr-TR", { weekday: "short" });
}

function addDays(date: Date, amount: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + amount);
  return copy;
}

function startOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function startOfWeek(date: Date, weekStartsOn: number) {
  const copy = startOfDay(date);
  const diff = (copy.getDay() + 7 - weekStartsOn) % 7;
  copy.setDate(copy.getDate() - diff);
  return copy;
}

function differenceInDays(a: Date, b: Date) {
  const ms = startOfDay(a).getTime() - startOfDay(b).getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

function buildTimelinePlacement(reservation: RoomReservation, windowStart: Date, windowDays: number) {
  const resStart = startOfDay(new Date(reservation.from));
  const resEnd = startOfDay(new Date(reservation.to));
  const windowEnd = startOfDay(addDays(windowStart, windowDays - 1));
  if (resEnd < windowStart || resStart > windowEnd) return null;

  const gridStart = Math.max(1, differenceInDays(resStart, windowStart) + 1);
  const endIndex = Math.min(windowDays, differenceInDays(resEnd, windowStart) + 1);
  const span = Math.max(1, endIndex - gridStart + 1);

  return { reservation, gridStart, span };
}
