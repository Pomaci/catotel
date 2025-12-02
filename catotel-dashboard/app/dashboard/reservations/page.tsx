"use client";

import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  Search,
  Trash2,
  X,
} from "lucide-react";
import {
  endOfDay,
  endOfMonth,
  endOfWeek,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { HotelApi } from "@/lib/api/hotel";
import type { Reservation, Room } from "@/types/hotel";

type StatusKey = keyof typeof statusVariantMap;
const statusVariantMap = {
  PENDING: "created",
  CONFIRMED: "confirmed",
  CHECKED_IN: "checkin",
  CHECKED_OUT: "checkout",
  CANCELLED: "cancelled",
} as const;

type DatePreset = "ALL" | "TODAY" | "WEEK" | "MONTH" | "CUSTOM";
type DateFilter = { preset: DatePreset; from?: string; to?: string };
type StatusFilter = Array<keyof typeof statusVariantMap>;

export default function ReservationsPage() {
  const {
    data: reservations,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["reservations"],
    queryFn: () => HotelApi.listReservations(),
  });
  const { data: rooms } = useQuery({
    queryKey: ["rooms"],
    queryFn: () => HotelApi.listRooms(),
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>([]);
  const [roomFilter, setRoomFilter] = useState<string[]>([]);
  const [dateFilter, setDateFilter] = useState<DateFilter>({ preset: "WEEK" });
  const [showFilters, setShowFilters] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const deleteMutation = useMutation({
    mutationFn: (id: string) => HotelApi.deleteReservation(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["reservations"] }),
    onError: (error: unknown) => {
      console.error(error);
      alert("Rezervasyon silinirken bir hata oluştu.");
    },
  });

  const filteredReservations = useMemo(() => {
    if (!reservations) return [];
    return reservations.filter((res) => {
      const matchesSearch =
        searchTerm.trim().length === 0 ||
        res.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        res.customer?.user.name
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        res.cats.some((c) =>
          c.cat.name.toLowerCase().includes(searchTerm.toLowerCase())
        );

      const matchesStatus =
        statusFilter.length === 0
          ? true
          : statusFilter.includes(res.status as keyof typeof statusVariantMap);

      const matchesRoom =
        roomFilter.length === 0 ? true : roomFilter.includes(res.room.name);

      const matchesDate = isWithinDateFilter(res, dateFilter);

      return matchesSearch && matchesStatus && matchesRoom && matchesDate;
    });
  }, [reservations, searchTerm, statusFilter, roomFilter, dateFilter]);

  const handleExport = () => {
    if (!filteredReservations.length) return;
    setExporting(true);
    try {
      const csv = buildReservationCsv(filteredReservations);
      const blob = new Blob([csv], {
        type: "text/csv;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `rezervasyonlar-${new Date()
        .toISOString()
        .slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteReservation = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteMutation.mutateAsync(id);
    } finally {
      setDeletingId((current) => (current === id ? null : current));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        onExport={handleExport}
        exportDisabled={filteredReservations.length === 0 || isLoading}
        exporting={exporting}
      />
      <div className="flex items-center justify-end">
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold text-[var(--admin-text-strong)] transition hover:-translate-y-0.5 hover:border-peach-300 hover:text-peach-500 admin-border"
          onClick={() => setShowFilters((v) => !v)}
        >
          {showFilters ? "Filtreleri Gizle" : "Filtreleri Goster"}
          <ChevronDown
            className={clsx(
              "h-4 w-4 text-[var(--admin-muted)] transition",
              showFilters ? "rotate-180" : "rotate-0"
            )}
            aria-hidden
          />
        </button>
      </div>
      {showFilters && (
        <FilterBar
          searchTerm={searchTerm}
          onSearch={setSearchTerm}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          roomFilter={roomFilter}
          onRoomChange={setRoomFilter}
          dateFilter={dateFilter}
          onDateChange={setDateFilter}
          rooms={rooms}
          onReset={() => {
            setSearchTerm("");
            setStatusFilter([]);
            setRoomFilter([]);
            setDateFilter({ preset: "WEEK" });
          }}
        />
      )}
      <InfoStrip total={reservations?.length ?? 0} />
      <ReservationTable
        reservations={filteredReservations}
        loading={isLoading}
        error={error instanceof Error ? error.message : null}
        onCancel={handleDeleteReservation}
        deletingId={deletingId}
      />
    </div>
  );
}

function PageHeader({
  onExport,
  exportDisabled,
  exporting,
}: {
  onExport: () => void;
  exportDisabled: boolean;
  exporting: boolean;
}) {
  return (
    <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.35em] admin-muted">
          Rezervasyon Yönetimi
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-[var(--admin-text-strong)]">
          Rezervasyonlar
        </h1>
        <p className="mt-1 text-sm admin-muted">
          Tüm rezervasyonları yönet ve operasyonu takip et.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onExport}
          disabled={exportDisabled || exporting}
          className={clsx(
            "inline-flex items-center gap-2 rounded-full border bg-[var(--admin-surface)] px-5 py-2.5 text-sm font-semibold text-[var(--admin-text-strong)] shadow-sm transition hover:-translate-y-0.5 hover:border-peach-300 hover:text-peach-500 admin-border",
            (exportDisabled || exporting) &&
              "cursor-not-allowed opacity-60 hover:translate-y-0 hover:border-[var(--admin-border)] hover:text-[var(--admin-text-strong)]"
          )}
        >
          <Download className="h-4 w-4 text-[var(--admin-muted)]" aria-hidden />
          {exporting ? "Dışa Aktarılıyor..." : "Dışarı Aktar (CSV)"}
        </button>
        <Link
          href="/dashboard/reservations/new"
          className="inline-flex items-center gap-2 rounded-full bg-peach-400 px-5 py-2.5 text-sm font-semibold text-white shadow-glow transition hover:-translate-y-0.5"
        >
          Yeni Rezervasyon Oluştur
        </Link>
      </div>
    </header>
  );
}

function FilterBar({
  searchTerm,
  onSearch,
  statusFilter,
  onStatusChange,
  roomFilter,
  onRoomChange,
  dateFilter,
  onDateChange,
  rooms,
  onReset,
}: {
  searchTerm: string;
  onSearch: (v: string) => void;
  statusFilter: StatusFilter;
  onStatusChange: (v: StatusFilter) => void;
  roomFilter: string[];
  onRoomChange: (v: string[]) => void;
  dateFilter: DateFilter;
  onDateChange: (v: DateFilter) => void;
  rooms?: Room[];
  onReset: () => void;
}) {
  const activeFilters = [
    searchTerm ? `Arama: ${searchTerm}` : null,
    statusFilter.length
      ? `Durum: ${statusFilter
          .map((s) => formatStatus(s as StatusKey))
          .join(", ")}`
      : null,
    roomFilter.length ? `Oda: ${roomFilter.join(", ")}` : null,
    dateFilter.preset !== "WEEK"
      ? `Tarih: ${
          dateFilter.preset === "CUSTOM"
            ? `${dateFilter.from ?? "?"} - ${dateFilter.to ?? "?"}`
            : datePresetLabel(dateFilter.preset)
        }`
      : null,
  ].filter(Boolean) as string[];

  return (
    <section className="admin-surface space-y-4 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] admin-muted">
            Filtre bar
          </p>
          <p className="text-sm text-[var(--admin-text-strong)]">
            Tarih, durum, oda ve aramayı tek yerden kontrol et.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {activeFilters.map((filter) => (
            <FilterTag key={filter} label={filter} onRemove={onReset} />
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <FilterField
          label="Tarih Aralığı"
          description="Bugün, Bu Hafta, Bu Ay veya özel aralık"
          icon={
            <CalendarRange
              className="h-4 w-4 text-[var(--admin-muted)]"
              aria-hidden
            />
          }
        >
          <div className="flex flex-wrap gap-2">
            {[
              { label: "Bugün", preset: "TODAY" },
              { label: "Bu Hafta", preset: "WEEK" },
              { label: "Bu Ay", preset: "MONTH" },
              { label: "Tüm", preset: "ALL" },
            ].map((opt) => (
              <button
                key={opt.preset}
                type="button"
                onClick={() =>
                  onDateChange({ preset: opt.preset as DatePreset })
                }
                className={clsx(
                  "filter-chip",
                  dateFilter.preset === opt.preset && "filter-chip--active"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <div className="mt-2 space-y-2">
            <div className="flex items-center gap-2 rounded-2xl border bg-[var(--admin-surface-alt)] px-3 py-2 text-sm admin-border">
              <span className="text-[var(--admin-muted)] text-xs">
                Başlangıç
              </span>
              <input
                type="date"
                value={dateFilter.from ?? ""}
                onChange={(e) =>
                  onDateChange({
                    preset: "CUSTOM",
                    from: e.target.value,
                    to: dateFilter.to,
                  })
                }
                className="w-full bg-transparent text-sm text-[var(--admin-text-strong)] focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-2 rounded-2xl border bg-[var(--admin-surface-alt)] px-3 py-2 text-sm admin-border">
              <span className="text-[var(--admin-muted)] text-xs">Bitiş</span>
              <input
                type="date"
                value={dateFilter.to ?? ""}
                onChange={(e) =>
                  onDateChange({
                    preset: "CUSTOM",
                    from: dateFilter.from,
                    to: e.target.value,
                  })
                }
                className="w-full bg-transparent text-sm text-[var(--admin-text-strong)] focus:outline-none"
              />
            </div>
          </div>
        </FilterField>
        <FilterField
          label="Durum"
          description="Birden fazla durum seçebilirsin"
          icon={
            <Filter className="h-4 w-4 text-[var(--admin-muted)]" aria-hidden />
          }
        >
          <div className="flex flex-wrap gap-2">
            {(Object.keys(statusVariantMap) as StatusKey[]).map((option) => {
              const active = statusFilter.includes(option);
              return (
                <span
                  key={option}
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    if (active) {
                      onStatusChange(statusFilter.filter((s) => s !== option));
                    } else {
                      onStatusChange([...statusFilter, option]);
                    }
                  }}
                  className={clsx(
                    "status-badge cursor-pointer text-xs font-semibold",
                    active ? "ring-2 ring-peach-300" : ""
                  )}
                  data-variant={statusVariantMap[option]}
                >
                  {formatStatus(option)}
                </span>
              );
            })}
            <button
              type="button"
              onClick={() => onStatusChange([])}
              className="rounded-full border px-3 py-1 text-xs font-semibold transition admin-border hover:border-peach-200"
            >
              Tüm
            </button>
          </div>
        </FilterField>
        <FilterField
          label="Oda"
          description="Tüm Odalar"
          icon={
            <DoorOpen
              className="h-4 w-4 text-[var(--admin-muted)]"
              aria-hidden
            />
          }
        >
          <div className="mt-2 flex flex-wrap gap-2">
            {["Tüm Odalar", ...(rooms?.map((r) => r.name) ?? [])].map(
              (room) => (
                <span
                  key={room}
                  className={clsx(
                    "filter-chip",
                    (room === "Tüm Odalar"
                      ? roomFilter.length === 0
                      : roomFilter.includes(room)) && "filter-chip--active"
                  )}
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    if (room === "Tüm Odalar") {
                      onRoomChange([]);
                      return;
                    }
                    if (roomFilter.includes(room)) {
                      onRoomChange(roomFilter.filter((r) => r !== room));
                    } else {
                      onRoomChange([...roomFilter, room]);
                    }
                  }}
                >
                  {room}
                </span>
              )
            )}
          </div>
        </FilterField>
        <FilterField
          label="Arama"
          description="Müşteri veya kedi adı"
          className="xl:col-span-2"
          icon={
            <Search className="h-4 w-4 text-[var(--admin-muted)]" aria-hidden />
          }
        >
          <div className="flex items-center gap-2 rounded-2xl border bg-[var(--admin-surface-alt)] px-3 py-3 text-sm admin-border">
            <Search className="h-4 w-4 text-[var(--admin-muted)]" aria-hidden />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Müşteri adı veya kedi adı ile ara..."
              className="w-full bg-transparent text-[var(--admin-text-strong)] placeholder:text-[var(--admin-muted)] focus:outline-none"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => onSearch("")}
                className="rounded-full p-1 text-[var(--admin-muted)] transition hover:text-peach-400"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            )}
          </div>
        </FilterField>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
          <span className="admin-chip">Check-in penceresi: 09:00 - 18:00</span>
          <span className="admin-chip">Geç çıkış isteği: 2</span>
          <span className="admin-chip">Minimum 2 gece</span>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold text-[var(--admin-muted)] transition hover:-translate-y-0.5 hover:border-peach-300 hover:text-peach-500 admin-border"
          onClick={onReset}
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
    <div
      className={clsx(
        "space-y-2 rounded-2xl bg-[var(--admin-surface-alt)] p-3",
        className
      )}
    >
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

function FilterTag({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <span className="filter-tag">
      {label}
      <button
        type="button"
        onClick={onRemove}
        className="rounded-full p-1 text-[var(--admin-muted)] transition hover:text-peach-400"
      >
        <X className="h-3.5 w-3.5" aria-hidden />
      </button>
    </span>
  );
}

function InfoStrip({ total }: { total: number }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-gradient-to-r from-[var(--admin-surface)] to-[var(--admin-surface-alt)] px-4 py-3 text-sm font-semibold shadow-sm admin-border md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-2 text-peach-500">
        <CheckCircle2 className="h-4 w-4" aria-hidden />
        Toplam {total} rezervasyon listelendi.
      </div>
      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold admin-muted">
        <span className="admin-chip">Gece sayısı ortalama: 4.2</span>
        <span className="admin-chip">İptal oranı: %3.4</span>
        <span className="admin-chip">Oda doluluğu: %87</span>
      </div>
    </div>
  );
}

function ReservationTable({
  reservations,
  loading,
  error,
  onCancel,
  deletingId,
}: {
  reservations: Reservation[];
  loading: boolean;
  error: string | null;
  onCancel: (id: string) => Promise<any>;
  deletingId: string | null;
}) {
  const router = useRouter();
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => {
    if (!openMenuId) return undefined;
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target?.closest("[data-reservation-actions-menu='true']") ||
        target?.closest("[data-reservation-actions-toggle='true']")
      ) {
        return;
      }
      setOpenMenuId(null);
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [openMenuId]);

  const handleRowNavigation = (id: string) => {
    router.push(`/dashboard/reservations/${id}`);
  };

  const handleDelete = async (id: string) => {
    setOpenMenuId(null);
    await onCancel(id);
  };

  return (
    <section className="admin-surface p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] admin-muted">
            Liste
          </p>
          <h2 className="text-xl font-semibold text-[var(--admin-text-strong)]">
            Rezervasyon tablosu
          </h2>
          <p className="text-xs admin-muted">
            Tüm satırlar tıklanabilir ve detay sayfasına gider.
          </p>
        </div>
      </div>

      {error && (
        <p className="mt-4 text-sm font-semibold text-red-500">{error}</p>
      )}

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
            {loading &&
              Array.from({ length: 4 }).map((_, idx) => (
                // eslint-disable-next-line react/no-array-index-key
                <tr key={idx} className="border-t">
                  <td className="py-4 pr-3">
                    <div className="h-4 w-40 rounded bg-[var(--admin-surface-alt)] animate-pulse" />
                  </td>
                  <td className="py-4 pr-3">
                    <div className="h-4 w-28 rounded bg-[var(--admin-surface-alt)] animate-pulse" />
                  </td>
                  <td className="py-4 pr-3">
                    <div className="h-4 w-32 rounded bg-[var(--admin-surface-alt)] animate-pulse" />
                  </td>
                  <td className="py-4 pr-3">
                    <div className="h-4 w-20 rounded bg-[var(--admin-surface-alt)] animate-pulse" />
                  </td>
                  <td className="py-4 pr-3">
                    <div className="h-4 w-16 rounded bg-[var(--admin-surface-alt)] animate-pulse" />
                  </td>
                  <td className="py-4 pr-3">
                    <div className="h-4 w-16 rounded bg-[var(--admin-surface-alt)] animate-pulse" />
                  </td>
                </tr>
              ))}

            {!loading &&
              reservations.map((reservation, index) => {
                const catNames = reservation.cats
                  .map((c) => c.cat.name)
                  .filter(Boolean);
                const primaryCat = reservation.cats[0]?.cat;
                const status =
                  statusVariantMap[
                    reservation.status as keyof typeof statusVariantMap
                  ];
                const isDeleting = deletingId === reservation.id;
                return (
                  <tr
                    key={reservation.id}
                    className={clsx(
                      "group cursor-pointer border-t text-[var(--admin-text-strong)] transition",
                      "hover:-translate-y-[1px] hover:bg-[var(--admin-highlight-muted)]/60 hover:shadow-sm",
                      index === 0 && "border-t-0",
                      openMenuId === reservation.id && "relative z-20"
                    )}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleRowNavigation(reservation.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleRowNavigation(reservation.id);
                      }
                    }}
                  >
                    <td className="py-4 pr-3">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--admin-highlight-muted)] text-peach-500">
                          <span className="text-sm font-semibold">
                            {(
                              reservation.customer?.user.name ??
                              reservation.code
                            ).charAt(0)}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 text-base font-semibold">
                            {reservation.customer?.user.name ??
                              "Müşteri bilgisi yok"}
                            <span className="rounded-full bg-[var(--admin-surface-alt)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.3em] admin-muted">
                              {reservation.code}
                            </span>
                          </div>
                          <p className="mt-1 text-xs admin-muted">
                            {reservation.customer?.user.email ?? "E-posta yok"}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 pr-3">
                      <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--admin-surface-alt)] text-[var(--admin-muted)]">
                          <Cat className="h-4 w-4" aria-hidden />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-semibold">
                            {primaryCat?.name ?? "Kedi yok"}
                            {catNames.length > 1 && (
                              <span className="ml-2 rounded-full bg-[var(--admin-surface-alt)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.3em] admin-muted">
                                +{catNames.length - 1}
                              </span>
                            )}
                          </p>
                          {primaryCat?.breed && (
                            <p className="text-xs admin-muted">
                              Cins: {primaryCat.breed}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-4 pr-3">
                      <div className="flex items-center gap-2 font-semibold">
                        <span>{formatDate(reservation.checkIn)}</span>
                        <ArrowRight
                          className="h-4 w-4 text-[var(--admin-muted)]"
                          aria-hidden
                        />
                        <span>{formatDate(reservation.checkOut)}</span>
                      </div>
                      <p className="text-xs admin-muted">
                        {calculateNights(
                          reservation.checkIn,
                          reservation.checkOut
                        )}{" "}
                        gece
                      </p>
                    </td>

                    <td className="py-4 pr-3">
                      <div className="flex items-center gap-2 font-semibold">
                        <DoorOpen
                          className="h-4 w-4 text-peach-400"
                          aria-hidden
                        />
                        {reservation.room.name}
                      </div>
                      <p className="text-xs admin-muted">
                        {reservation.room.description ??
                          reservation.room.type ??
                          "Oda"}
                      </p>
                    </td>

                    <td className="py-4 pr-3">
                      <StatusBadge status={status} />
                    </td>

                    <td className="py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/dashboard/reservations/${reservation.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold text-[var(--admin-text-strong)] transition hover:-translate-y-0.5 hover:border-peach-300 hover:text-peach-500 admin-border"
                        >
                          Detay
                        </Link>
                        <div
                          className="relative"
                          data-reservation-actions-menu="true"
                        >
                          <button
                            type="button"
                            aria-label="Daha fazla"
                            aria-expanded={openMenuId === reservation.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuId(
                                openMenuId === reservation.id
                                  ? null
                                  : reservation.id
                              );
                            }}
                            className="rounded-full border bg-[var(--admin-surface-alt)] p-2 text-[var(--admin-muted)] transition hover:-translate-y-0.5 hover:border-peach-300 hover:text-peach-500 admin-border"
                            data-reservation-actions-toggle="true"
                          >
                            <MoreHorizontal className="h-4 w-4" aria-hidden />
                          </button>
                          {openMenuId === reservation.id && (
                            <div className="absolute right-0 z-10 mt-2 w-44 rounded-xl border bg-[var(--admin-surface)] p-2 text-left shadow-lg admin-border">
                              <Link
                                href={`/dashboard/reservations/${reservation.id}/edit`}
                                onClick={(e) => e.stopPropagation()}
                                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-[var(--admin-text-strong)] transition hover:bg-[var(--admin-surface-alt)] hover:text-peach-500"
                              >
                                <Edit2 className="h-3.5 w-3.5" aria-hidden />
                                Düzenle
                              </Link>
                              <button
                                type="button"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  await handleDelete(reservation.id);
                                }}
                                disabled={isDeleting}
                                className={clsx(
                                  "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition hover:bg-[var(--admin-surface-alt)]",
                                  isDeleting
                                    ? "text-[var(--admin-muted)]"
                                    : "text-red-500"
                                )}
                              >
                                <Trash2 className="h-3.5 w-3.5" aria-hidden />
                                {isDeleting ? "Siliniyor..." : "Sil"}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}

            {!loading && reservations.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="py-6 text-center text-sm text-[var(--admin-muted)]"
                >
                  Gösterilecek rezervasyon bulunamadı.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function buildReservationCsv(reservations: Reservation[]) {
  const headers = [
    "Kod",
    "Müşteri",
    "E-posta",
    "Kediler",
    "Giriş",
    "Çıkış",
    "Oda",
    "Durum",
    "Toplam",
  ];

  const rows = reservations.map((res) => {
    const status =
      statusVariantMap[res.status as keyof typeof statusVariantMap];
    const cats = res.cats
      .map((c) => c.cat.name)
      .filter(Boolean)
      .join(" | ");
    return [
      res.code,
      res.customer?.user.name ?? "",
      res.customer?.user.email ?? "",
      cats || "Kedi yok",
      formatDate(res.checkIn),
      formatDate(res.checkOut),
      res.room.name,
      formatStatusFromVariant(status),
      res.totalPrice?.toString() ?? "",
    ]
      .map(csvEscape)
      .join(",");
  });

  return [headers.join(","), ...rows].join("\n");
}

function csvEscape(value: string) {
  const safe = value ?? "";
  if (safe.includes(",") || safe.includes('"') || safe.includes("\n")) {
    return `"${safe.replace(/"/g, '""')}"`;
  }
  return safe;
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className="status-badge" data-variant={status}>
      {formatStatusFromVariant(status)}
    </span>
  );
}

function formatStatusFromVariant(status: string) {
  if (status === "created") return "Oluşturuldu";
  if (status === "confirmed") return "Onaylandı";
  if (status === "checkin") return "Check-in";
  if (status === "checkout") return "Check-out";
  if (status === "cancelled") return "İptal";
  return status;
}

function formatStatus(status: StatusKey) {
  return status
    .replace("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDate(value: string) {
  const d = new Date(value);
  return d.toLocaleDateString("tr-TR", { day: "2-digit", month: "short" });
}

function calculateNights(checkIn: string, checkOut: string) {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const diff = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
  return Math.max(1, Math.round(diff));
}

function isWithinDateFilter(reservation: Reservation, filter: DateFilter) {
  if (filter.preset === "ALL") return true;
  const range = getDateRange(filter);
  const minDate = new Date(-8640000000000000);
  const maxDate = new Date(8640000000000000);
  const from = range.from ?? minDate;
  const to = range.to ?? maxDate;
  const checkIn = new Date(reservation.checkIn);
  const checkOut = new Date(reservation.checkOut);
  return checkIn <= to && checkOut >= from;
}

function getDateRange(filter: DateFilter) {
  if (filter.preset === "CUSTOM") {
    return {
      from: filter.from ? startOfDay(new Date(filter.from)) : undefined,
      to: filter.to ? endOfDay(new Date(filter.to)) : undefined,
    };
  }
  const today = new Date();
  if (filter.preset === "TODAY") {
    return { from: startOfDay(today), to: endOfDay(today) };
  }
  if (filter.preset === "WEEK") {
    return {
      from: startOfWeek(today, { weekStartsOn: 1 }),
      to: endOfWeek(today, { weekStartsOn: 1 }),
    };
  }
  if (filter.preset === "MONTH") {
    return { from: startOfMonth(today), to: endOfMonth(today) };
  }
  return { from: undefined, to: undefined };
}

function datePresetLabel(preset: DatePreset) {
  if (preset === "TODAY") return "Bugün";
  if (preset === "WEEK") return "Bu Hafta";
  if (preset === "MONTH") return "Bu Ay";
  if (preset === "ALL") return "Tümü";
  return "Özel";
}
