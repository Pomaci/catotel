"use client";

import clsx from "clsx";
import {
  ArrowRight,
  CalendarRange,
  Cat,
  CheckCircle2,
  ChevronDown,
  DoorOpen,
  Download,
  Edit2,
  Filter,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";

type StatusKey = "created" | "confirmed" | "checkin" | "checkout" | "cancelled";

type ReservationRow = {
  id: string;
  customer: string;
  contact: string;
  cat: string;
  breed: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  room: string;
  status: StatusKey;
};

const statusMeta: Record<
  StatusKey,
  { label: string; tone: "created" | "confirmed" | "checkin" | "checkout" | "cancelled" }
> = {
  created: { label: "Oluşturuldu", tone: "created" },
  confirmed: { label: "Onaylandı", tone: "confirmed" },
  checkin: { label: "Check-in", tone: "checkin" },
  checkout: { label: "Check-out", tone: "checkout" },
  cancelled: { label: "İptal", tone: "cancelled" },
};

const reservations: ReservationRow[] = [
  {
    id: "RSV-2043",
    customer: "Duru Aksoy",
    contact: "duru.aksoy@mail.com · +90 532 444 56 32",
    cat: "Misket",
    breed: "British Shorthair",
    checkIn: "12 Kasım",
    checkOut: "17 Kasım",
    nights: 5,
    room: "Oda 204",
    status: "confirmed",
  },
  {
    id: "RSV-2044",
    customer: "Selin Kara",
    contact: "selin.kara@mail.com · +90 542 210 33 14",
    cat: "Pofuduk",
    breed: "Scottish Fold",
    checkIn: "12 Kasım",
    checkOut: "14 Kasım",
    nights: 2,
    room: "Oda 102",
    status: "checkin",
  },
  {
    id: "RSV-2045",
    customer: "Tolga Sezen",
    contact: "tolga.sz@mail.com · +90 533 830 20 17",
    cat: "Karamel",
    breed: "Maine Coon",
    checkIn: "13 Kasım",
    checkOut: "20 Kasım",
    nights: 7,
    room: "Oda 305",
    status: "created",
  },
  {
    id: "RSV-2046",
    customer: "Efe Yalçın",
    contact: "efe.yalcin@mail.com · +90 535 990 40 88",
    cat: "Atlas",
    breed: "Van Kedisi",
    checkIn: "11 Kasım",
    checkOut: "15 Kasım",
    nights: 4,
    room: "Oda 108",
    status: "checkout",
  },
  {
    id: "RSV-2047",
    customer: "Melis Karaca",
    contact: "melis.kr@mail.com · +90 555 110 14 22",
    cat: "Luna",
    breed: "Tekir",
    checkIn: "10 Kasım",
    checkOut: "12 Kasım",
    nights: 2,
    room: "Oda 207",
    status: "cancelled",
  },
  {
    id: "RSV-2048",
    customer: "Mert Aydın",
    contact: "mert.aydin@mail.com · +90 530 777 82 20",
    cat: "Zuzu",
    breed: "Sfenks",
    checkIn: "15 Kasım",
    checkOut: "18 Kasım",
    nights: 3,
    room: "Oda 401",
    status: "confirmed",
  },
];

const activeFilters = ["Bu Hafta", "Oda 200-400", "Durum: Onaylandı"];

const roomOptions = ["Tüm Odalar", "Oda 101", "Oda 102", "Oda 204", "Oda 207", "Oda 305", "Oda 401"];

const statusOptions = ["Tümü", "Oluşturuldu", "Onaylandı", "Check-in", "Check-out", "İptal"];

export default function ReservationsPage() {
  return (
    <div className="space-y-6">
      <PageHeader />
      <FilterBar />
      <InfoStrip />
      <ReservationTable />
    </div>
  );
}

function PageHeader() {
  return (
    <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.35em] admin-muted">Rezervasyon Yönetimi</p>
        <h1 className="mt-2 text-3xl font-semibold text-[var(--admin-text-strong)]">Rezervasyonlar</h1>
        <p className="mt-1 text-sm admin-muted">Tüm rezervasyonları yönet ve operasyonu takip et.</p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-full border bg-[var(--admin-surface)] px-5 py-2.5 text-sm font-semibold text-[var(--admin-text-strong)] shadow-sm transition hover:-translate-y-0.5 hover:border-peach-300 hover:text-peach-500 admin-border"
        >
          <Download className="h-4 w-4 text-[var(--admin-muted)]" aria-hidden />
          Dışa Aktar (CSV / PDF)
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-full bg-peach-400 px-5 py-2.5 text-sm font-semibold text-white shadow-glow transition hover:-translate-y-0.5"
        >
          <Plus className="h-4 w-4" aria-hidden />
          Yeni Rezervasyon Oluştur
        </button>
      </div>
    </header>
  );
}

function FilterBar() {
  return (
    <section className="admin-surface space-y-4 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] admin-muted">Filtre bar</p>
          <p className="text-sm text-[var(--admin-text-strong)]">
            Tarih, durum, oda ve aramayı tek yerden kontrol et.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {activeFilters.map((filter) => (
            <FilterTag key={filter} label={filter} />
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <FilterField
          label="Tarih Aralığı"
          description="Varsayılan: Bu Hafta"
          icon={<CalendarRange className="h-4 w-4 text-[var(--admin-muted)]" aria-hidden />}
        >
          <button
            type="button"
            className="flex w-full items-center justify-between rounded-2xl border bg-[var(--admin-surface-alt)] px-3 py-3 text-left text-sm font-semibold text-[var(--admin-text-strong)] transition hover:border-peach-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-peach-300 admin-border"
          >
            <span className="flex items-center gap-2">
              <CalendarRange className="h-4 w-4 text-peach-400" aria-hidden />
              Bu Hafta
            </span>
            <ChevronDown className="h-4 w-4 text-[var(--admin-muted)]" aria-hidden />
          </button>
        </FilterField>

        <FilterField
          label="Durum"
          description="Oluşturuldu, Onaylandı..."
          icon={<Filter className="h-4 w-4 text-[var(--admin-muted)]" aria-hidden />}
        >
          <div className="flex items-center gap-2 rounded-2xl border bg-[var(--admin-surface-alt)] px-3 py-3 text-sm admin-border">
            <div className="flex items-center gap-2 text-[var(--admin-text-strong)]">
              <span className="h-2 w-2 rounded-full bg-peach-400" aria-hidden />
              Onaylandı
            </div>
            <ChevronDown className="ml-auto h-4 w-4 text-[var(--admin-muted)]" aria-hidden />
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {statusOptions.map((option) => (
              <span
                key={option}
                className={clsx(
                  "status-badge cursor-pointer text-xs font-semibold",
                  option === "Onaylandı" ? "ring-2 ring-peach-300" : "",
                )}
                data-variant={mapStatusToVariant(option)}
              >
                {option}
              </span>
            ))}
          </div>
        </FilterField>

        <FilterField
          label="Oda"
          description="Tüm Odalar"
          icon={<DoorOpen className="h-4 w-4 text-[var(--admin-muted)]" aria-hidden />}
        >
          <div className="flex items-center gap-2 rounded-2xl border bg-[var(--admin-surface-alt)] px-3 py-3 text-sm admin-border">
            <DoorOpen className="h-4 w-4 text-peach-400" aria-hidden />
            <span className="font-semibold text-[var(--admin-text-strong)]">Oda 204</span>
            <ChevronDown className="ml-auto h-4 w-4 text-[var(--admin-muted)]" aria-hidden />
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {roomOptions.map((room) => (
              <span
                key={room}
                className={clsx(
                  "filter-chip",
                  room === "Oda 204" && "filter-chip--active",
                )}
              >
                {room}
              </span>
            ))}
          </div>
        </FilterField>

        <FilterField
          label="Arama"
          description="Müşteri veya kedi adı"
          className="xl:col-span-2"
          icon={<Search className="h-4 w-4 text-[var(--admin-muted)]" aria-hidden />}
        >
          <div className="flex items-center gap-2 rounded-2xl border bg-[var(--admin-surface-alt)] px-3 py-3 text-sm admin-border">
            <Search className="h-4 w-4 text-[var(--admin-muted)]" aria-hidden />
            <input
              type="text"
              placeholder="Müşteri adı veya kedi adı ile ara..."
              className="w-full bg-transparent text-[var(--admin-text-strong)] placeholder:text-[var(--admin-muted)] focus:outline-none"
            />
          </div>
        </FilterField>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
          <span className="admin-chip">Check-in pencere: 09:00 - 18:00</span>
          <span className="admin-chip">Geç çıkış isteği 2</span>
          <span className="admin-chip">Minimum 2 gece</span>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold text-[var(--admin-muted)] transition hover:-translate-y-0.5 hover:border-peach-300 hover:text-peach-500 admin-border"
        >
          <X className="h-4 w-4" aria-hidden />
          Filtreleri Temizle
        </button>
      </div>
    </section>
  );
}

function FilterField({
  label,
  description,
  icon,
  children,
  className,
}: {
  label: string;
  description?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx("space-y-2 rounded-2xl bg-[var(--admin-surface-alt)] p-3", className)}>
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] admin-muted">
        {icon}
        <span>{label}</span>
      </div>
      <div className="space-y-2">
        {children}
        {description && <p className="text-xs admin-muted">{description}</p>}
      </div>
    </div>
  );
}

function FilterTag({ label }: { label: string }) {
  return (
    <span className="filter-tag">
      {label}
      <button type="button" className="rounded-full p-1 text-[var(--admin-muted)] transition hover:text-peach-400">
        <X className="h-3.5 w-3.5" aria-hidden />
      </button>
    </span>
  );
}

function InfoStrip() {
  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-gradient-to-r from-[var(--admin-surface)] to-[var(--admin-surface-alt)] px-4 py-3 text-sm font-semibold shadow-sm admin-border md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-2 text-peach-500">
        <CheckCircle2 className="h-4 w-4" aria-hidden />
        Bugün 7 check-in, 5 check-out planlandı. Aktif rezervasyon: 42.
      </div>
      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold admin-muted">
        <span className="admin-chip">Gece sayısı ortalama: 4.2</span>
        <span className="admin-chip">İptal oranı: %3.4</span>
        <span className="admin-chip">Oda doluluğu: %87</span>
      </div>
    </div>
  );
}

function ReservationTable() {
  return (
    <section className="admin-surface p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] admin-muted">Liste</p>
          <h2 className="text-xl font-semibold text-[var(--admin-text-strong)]">Rezervasyon tablosu</h2>
          <p className="text-xs admin-muted">Tüm satırlar tıklanabilir ve detay sayfasına gider.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold admin-border">
            Göster:
            <span className="rounded-full bg-[var(--admin-highlight-muted)] px-2 py-1 text-[var(--admin-text-strong)]">25</span>
            <span className="rounded-full px-2 py-1 text-[var(--admin-muted)]">50</span>
            <span className="rounded-full px-2 py-1 text-[var(--admin-muted)]">100</span>
          </div>
          <div className="flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold admin-border">
            <button type="button" className="rounded-full px-2 py-1 text-[var(--admin-muted)] transition hover:text-[var(--admin-text-strong)]">
              {"<"}
            </button>
            <button type="button" className="rounded-full bg-[var(--admin-highlight-muted)] px-2 py-1 text-[var(--admin-text-strong)] shadow-sm">
              1
            </button>
            <button type="button" className="rounded-full px-2 py-1 text-[var(--admin-muted)] transition hover:text-[var(--admin-text-strong)]">
              2
            </button>
            <button type="button" className="rounded-full px-2 py-1 text-[var(--admin-muted)] transition hover:text-[var(--admin-text-strong)]">
              3
            </button>
            <button type="button" className="rounded-full px-2 py-1 text-[var(--admin-muted)] transition hover:text-[var(--admin-text-strong)]">
              4
            </button>
            <button type="button" className="rounded-full px-2 py-1 text-[var(--admin-muted)] transition hover:text-[var(--admin-text-strong)]">
              {">"}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[960px] text-left">
          <thead>
            <tr className="text-[11px] uppercase tracking-[0.35em] text-[var(--admin-muted)]">
              <th className="py-3 pr-3 font-semibold">Müşteri adı</th>
              <th className="py-3 pr-3 font-semibold">Kedi adı</th>
              <th className="py-3 pr-3 font-semibold">Giriş - Çıkış</th>
              <th className="py-3 pr-3 font-semibold">Oda</th>
              <th className="py-3 pr-3 font-semibold">Durum</th>
              <th className="py-3 text-right font-semibold">İşlemler</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {reservations.map((reservation, index) => (
              <tr
                key={reservation.id}
                className={clsx(
                  "group cursor-pointer border-t text-[var(--admin-text-strong)] transition",
                  "hover:-translate-y-[1px] hover:bg-[var(--admin-highlight-muted)]/60 hover:shadow-sm",
                  index === 0 && "border-t-0",
                )}
              >
                <td className="py-4 pr-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--admin-highlight-muted)] text-peach-500">
                      <span className="text-sm font-semibold">{reservation.customer.charAt(0)}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-base font-semibold">
                        {reservation.customer}
                        <span className="rounded-full bg-[var(--admin-surface-alt)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.3em] admin-muted">
                          {reservation.id}
                        </span>
                      </div>
                      <p className="mt-1 text-xs admin-muted">{reservation.contact}</p>
                    </div>
                  </div>
                </td>

                <td className="py-4 pr-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--admin-surface-alt)] text-[var(--admin-muted)]">
                      <Cat className="h-4 w-4" aria-hidden />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{reservation.cat}</p>
                      <p className="text-xs admin-muted">Cins: {reservation.breed}</p>
                    </div>
                  </div>
                </td>

                <td className="py-4 pr-3">
                  <div className="flex items-center gap-2 font-semibold">
                    <span>{reservation.checkIn}</span>
                    <ArrowRight className="h-4 w-4 text-[var(--admin-muted)]" aria-hidden />
                    <span>{reservation.checkOut}</span>
                  </div>
                  <p className="text-xs admin-muted">{reservation.nights} gece</p>
                </td>

                <td className="py-4 pr-3">
                  <div className="flex items-center gap-2 font-semibold">
                    <DoorOpen className="h-4 w-4 text-peach-400" aria-hidden />
                    {reservation.room}
                  </div>
                  <p className="text-xs admin-muted">Temizlik 11:00 · Servis 18:00</p>
                </td>

                <td className="py-4 pr-3">
                  <StatusBadge status={reservation.status} />
                </td>

                <td className="py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      className="hidden items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold text-[var(--admin-muted)] transition hover:-translate-y-0.5 hover:text-peach-500 group-hover:inline-flex"
                    >
                      <Edit2 className="h-3.5 w-3.5" aria-hidden />
                      Düzenle
                    </button>
                    <button
                      type="button"
                      className="hidden items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold text-[var(--admin-muted)] transition hover:-translate-y-0.5 hover:text-red-500 group-hover:inline-flex"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden />
                      Sil
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold text-[var(--admin-text-strong)] transition hover:-translate-y-0.5 hover:border-peach-300 hover:text-peach-500 admin-border"
                    >
                      Detay →
                    </button>
                    <button
                      type="button"
                      aria-label="Daha fazla"
                      className="rounded-full border bg-[var(--admin-surface-alt)] p-2 text-[var(--admin-muted)] transition hover:-translate-y-0.5 hover:border-peach-300 hover:text-peach-500 admin-border"
                    >
                      <MoreHorizontal className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-sm font-semibold text-[var(--admin-muted)]">Toplam 124 rezervasyon bulundu.</p>
    </section>
  );
}

function StatusBadge({ status }: { status: StatusKey }) {
  const meta = statusMeta[status];
  return (
    <span className="status-badge" data-variant={meta.tone}>
      {meta.label}
    </span>
  );
}

function mapStatusToVariant(status: string) {
  if (status === "Oluşturuldu") return "created";
  if (status === "Onaylandı") return "confirmed";
  if (status === "Check-in") return "checkin";
  if (status === "Check-out") return "checkout";
  if (status === "İptal") return "cancelled";
  return "created";
}
