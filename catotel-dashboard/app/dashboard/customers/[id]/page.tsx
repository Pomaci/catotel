"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import clsx from "clsx";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  BadgeCheck,
  CalendarClock,
  Cat,
  Check,
  ChevronDown,
  ChevronRight,
  Edit3,
  Ellipsis,
  Heart,
  Mail,
  MapPin,
  NotebookPen,
  PawPrint,
  PenLine,
  Phone,
  Plus,
  Scale,
  ShieldCheck,
  Trash2,
  User,
  Wallet,
  X,
} from "lucide-react";
import { AdminApi, type AdminCustomerDetail } from "@/lib/api/admin";

type TabKey = "cats" | "reservations" | "notes";
type ReservationFilter = "all" | "past" | "active";

type CatCard = {
  id: string;
  name: string;
  breed: string;
  age: number | null;
  weight: string;
  neutered: boolean;
  avatar?: string;
  tags?: string[];
};

type ReservationRow = {
  id: string;
  code: string;
  catName: string;
  catAvatar?: string;
  dateRange: string;
  nights: number;
  room: string;
  status: "approved" | "checkin" | "checkout" | "cancelled";
  total: string;
};

type NoteItem = {
  id: string;
  title: string;
  text: string;
  category: "behavior" | "payment" | "health" | "other";
  author: string;
  date: string;
};

export default function CustomerDetailPage() {
  const params = useParams<{ id: string }>();
  const customerId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const [activeTab, setActiveTab] = useState<TabKey>("cats");
  const [reservationFilter, setReservationFilter] = useState<ReservationFilter>("all");
  const [noteModalOpen, setNoteModalOpen] = useState(false);

  const {
    data: customer,
    isLoading,
    error,
  } = useQuery<AdminCustomerDetail>({
    queryKey: ["admin-customer", customerId],
    enabled: Boolean(customerId),
    queryFn: () => AdminApi.getCustomer(customerId!),
  });

  const catCards = useMemo(
    () => buildCatCards(customer?.cats ?? []),
    [customer?.cats],
  );
  const reservationRows = useMemo(
    () => buildReservationRows(customer?.reservations ?? []),
    [customer?.reservations],
  );
  const noteItems = useMemo(
    () => buildNoteItems(customer),
    [customer],
  );

  const filteredReservations = useMemo(() => {
    if (reservationFilter === "active") {
      return reservationRows.filter((row) => row.status === "approved" || row.status === "checkin");
    }
    if (reservationFilter === "past") {
      return reservationRows.filter((row) => row.status === "checkout" || row.status === "cancelled");
    }
    return reservationRows;
  }, [reservationFilter, reservationRows]);

  if (!customerId) {
    return (
      <div className="admin-surface p-6 text-sm font-semibold text-[var(--admin-muted)]">
        Musteri secilmedi.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="admin-surface p-6 text-sm font-semibold text-[var(--admin-muted)]">
        Musteri yukleniyor...
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="admin-surface p-6 text-sm font-semibold text-red-500">
        Musteri bulunamadi. {error instanceof Error ? error.message : ""}
      </div>
    );
  }

  const customerName = customer.name ?? customer.email ?? "Musteri";

  return (
    <div className="space-y-5">
      <ProfileHeader customer={customer} customerId={customerId} />
      <TabNavigation
        active={activeTab}
        onChange={setActiveTab}
        catsCount={catCards.length}
        reservationCount={reservationRows.length}
        noteCount={noteItems.length}
      />

      {activeTab === "cats" && <CatsPanel cats={catCards} />}

      {activeTab === "reservations" && (
        <ReservationsPanel
          reservations={filteredReservations}
          filter={reservationFilter}
          onFilterChange={setReservationFilter}
          customerName={customerName}
        />
      )}

      {activeTab === "notes" && (
        <NotesPanel notes={noteItems} onAddNote={() => setNoteModalOpen(true)} />
      )}

      {noteModalOpen && <NoteModal onClose={() => setNoteModalOpen(false)} />}
    </div>
  );
}

function ProfileHeader({
  customer,
  customerId,
}: {
  customer: AdminCustomerDetail;
  customerId: string;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    window.addEventListener("mousedown", handleClick);
    return () => window.removeEventListener("mousedown", handleClick);
  }, []);

  const displayName = customer.name ?? customer.email ?? "Musteri";
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <section className="relative overflow-hidden rounded-3xl border bg-[var(--admin-surface)] p-6 shadow-soft transition admin-border md:p-8">
      <div className="absolute inset-y-0 right-0 hidden w-1/3 translate-x-8 bg-gradient-to-l from-peach-400/15 via-transparent to-transparent blur-3xl lg:block" />
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-peach-300 to-lagoon-400 text-2xl font-bold text-white shadow-glow">
            {initials}
          </div>
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-semibold text-[var(--admin-text-strong)]">{displayName}</h1>
              <span className="inline-flex items-center gap-2 rounded-full bg-[var(--admin-highlight-muted)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-peach-500">
                <BadgeCheck className="h-4 w-4" aria-hidden />
                Aktif
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold text-[var(--admin-muted)] admin-border">
                Müşteri ID #{customerId}
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <InfoRow icon={<Phone className="h-4 w-4" aria-hidden />} label="Telefon" value={customer.phone ?? "Telefon yok"} />
              <InfoRow icon={<Mail className="h-4 w-4" aria-hidden />} label="E-posta" value={customer.email} />
              <InfoRow icon={<MapPin className="h-4 w-4" aria-hidden />} label="Adres" value={customer.address ?? "Adres yok"} />
            </div>
            <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-[var(--admin-surface-alt)] px-3 py-2 text-sm font-semibold">
              <span className="flex items-center gap-2 text-red-500">
                <AlertTriangle className="h-4 w-4" aria-hidden />
                Acil İletişim
              </span>
              <span className="flex items-center gap-2 text-[var(--admin-text-strong)]">
                <User className="h-4 w-4 text-[var(--admin-muted)]" aria-hidden />
                {customer.emergencyContactName ?? "Bilinmiyor"}
              </span>
              <span className="flex items-center gap-2 text-[var(--admin-muted)]">
                <Phone className="h-4 w-4" aria-hidden />
                {customer.emergencyContactPhone ?? "Telefon yok"}
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={`/dashboard/customers/${customerId}/edit`}
            className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold text-[var(--admin-text-strong)] transition hover:-translate-y-0.5 hover:border-peach-300 hover:text-peach-500 admin-border"
          >
            <PenLine className="h-4 w-4" aria-hidden />
            Düzenle
          </Link>
          <Link
            href={`/dashboard/reservations/new?customer=${customerId}`}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-peach-400 to-lagoon-500 px-5 py-2 text-sm font-semibold text-white shadow-soft transition hover:-translate-y-0.5"
          >
            <Plus className="h-4 w-4" aria-hidden />
            Rezervasyon Oluştur
          </Link>
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border bg-[var(--admin-surface-alt)] text-[var(--admin-muted)] transition hover:-translate-y-0.5 hover:border-peach-300 hover:text-peach-500 admin-border"
              aria-haspopup="true"
              aria-expanded={menuOpen}
              aria-label="Diğer işlemler"
            >
              <Ellipsis className="h-5 w-5" aria-hidden />
            </button>
            {menuOpen && (
              <div className="absolute right-0 z-20 mt-2 w-56 rounded-2xl border bg-[var(--admin-surface)] p-2 text-sm shadow-xl admin-border">
                <MenuItem icon={<NotebookPen className="h-4 w-4" aria-hidden />} label="Müşteriyi arşivle" />
                <MenuItem icon={<Mail className="h-4 w-4" aria-hidden />} label="E-posta gönder" />
                <MenuItem icon={<Trash2 className="h-4 w-4" aria-hidden />} label="Sil" danger />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function TabNavigation({
  active,
  onChange,
  catsCount,
  reservationCount,
  noteCount,
}: {
  active: TabKey;
  onChange: (tab: TabKey) => void;
  catsCount: number;
  reservationCount: number;
  noteCount: number;
}) {
  const tabs: Array<{ key: TabKey; label: string; hint: string }> = [
    { key: "cats", label: "Kediler", hint: `${catsCount} kayıt` },
    { key: "reservations", label: "Rezervasyon Geçmişi", hint: `${reservationCount} satır` },
    { key: "notes", label: "Notlar", hint: `${noteCount} not` },
  ];

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-1 admin-border">
      <div className="flex flex-wrap items-center gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            className={clsx(
              "relative rounded-2xl px-4 py-2 text-sm font-semibold transition focus:outline-none",
              active === tab.key
                ? "bg-[var(--admin-surface)] text-[var(--admin-text-strong)] shadow-sm"
                : "text-[var(--admin-muted)] hover:text-[var(--admin-text-strong)]",
            )}
          >
            <div className="flex items-center gap-2">
              <span>{tab.label}</span>
              <span className="rounded-full bg-[var(--admin-surface-alt)] px-2 py-0.5 text-[11px] font-semibold text-[var(--admin-muted)]">
                {tab.hint}
              </span>
            </div>
            {active === tab.key && (
              <span className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full bg-peach-400" aria-hidden />
            )}
          </button>
        ))}
      </div>
      <div className="hidden text-xs font-semibold uppercase tracking-[0.35em] text-[var(--admin-muted)] sm:block">
        Müşteri profili
      </div>
    </div>
  );
}

function CatsPanel({ cats }: { cats: CatCard[] }) {
  return (
    <section className="admin-surface space-y-4 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--admin-muted)]">Profil</p>
          <h3 className="text-xl font-semibold text-[var(--admin-text-strong)]">Kediler</h3>
          <p className="text-sm text-[var(--admin-muted)]">Tüm kediler için yaş, cins ve sağlık bilgileri.</p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-full border bg-[var(--admin-surface-alt)] px-4 py-2 text-sm font-semibold text-[var(--admin-text-strong)] transition hover:-translate-y-0.5 hover:border-peach-300 hover:text-peach-500 admin-border"
        >
          <Plus className="h-4 w-4" aria-hidden />
          Yeni Kedi Ekle
        </button>
      </div>

      {cats.length === 0 && (
        <p className="text-sm text-[var(--admin-muted)]">
          Bu musterinin kayitli kedisi yok.
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {cats.map((cat) => (
          <div
            key={cat.id}
            className="relative overflow-hidden rounded-2xl border bg-[var(--admin-surface)] p-4 transition hover:-translate-y-1 hover:shadow-soft admin-border"
          >
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-peach-400/10 via-transparent to-lagoon-400/10" />
            <div className="relative flex items-start gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--admin-highlight-muted)] text-peach-500">
                {cat.avatar ? (
                  <img src={cat.avatar} alt={cat.name} className="h-full w-full rounded-xl object-cover" />
                ) : (
                  <Cat className="h-5 w-5" aria-hidden />
                )}
              </div>
              <div className="flex-1 space-y-1.5">
                <div className="flex items-center gap-2">
                  <p className="text-lg font-semibold text-[var(--admin-text-strong)]">{cat.name}</p>
                  <span
                    className={clsx(
                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                      cat.neutered
                        ? "bg-emerald-500/15 text-emerald-600"
                        : "bg-amber-500/15 text-amber-600",
                    )}
                  >
                    <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
                    {cat.neutered ? "Kısır" : "Kısır değil"}
                  </span>
                </div>
                <p className="text-sm text-[var(--admin-muted)]">{cat.breed}</p>
                <div className="grid grid-cols-2 gap-2 text-sm font-semibold text-[var(--admin-text-strong)]">
                  <Feature icon={<PawPrint className="h-4 w-4 text-[var(--admin-muted)]" aria-hidden />} label="Yaş" value={formatAge(cat.age)} />
                  <Feature icon={<Scale className="h-4 w-4 text-[var(--admin-muted)]" aria-hidden />} label="Ağırlık" value={cat.weight} />
                  <Feature icon={<Heart className="h-4 w-4 text-[var(--admin-muted)]" aria-hidden />} label="Veteriner" value="Aşı kartı var" />
                  <Feature icon={<BadgeCheck className="h-4 w-4 text-[var(--admin-muted)]" aria-hidden />} label="Profil" value="Sağlık tam" />
                </div>
                {cat.tags && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {cat.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-[var(--admin-surface-alt)] px-3 py-1 text-[11px] font-semibold text-[var(--admin-muted)] admin-border"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                <div className="mt-3 flex items-center justify-between">
                  <Link
                    href={`/dashboard/cats/${cat.id}`}
                    className="inline-flex items-center gap-1 text-sm font-semibold text-peach-500 transition hover:translate-x-1"
                  >
                    Profil <ChevronRight className="h-4 w-4" aria-hidden />
                  </Link>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="rounded-full border bg-[var(--admin-surface-alt)] p-2 text-[var(--admin-muted)] transition hover:-translate-y-0.5 hover:border-peach-300 hover:text-peach-500 admin-border"
                    >
                      <Edit3 className="h-4 w-4" aria-hidden />
                    </button>
                    <button
                      type="button"
                      className="rounded-full border bg-[var(--admin-surface-alt)] p-2 text-[var(--admin-muted)] transition hover:-translate-y-0.5 hover:border-red-300 hover:text-red-500 admin-border"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ReservationsPanel({
  reservations,
  filter,
  onFilterChange,
  customerName,
}: {
  reservations: ReservationRow[];
  filter: ReservationFilter;
  onFilterChange: (value: ReservationFilter) => void;
  customerName: string;
}) {
  const [open, setOpen] = useState(false);

  const filterOptions: Array<{ value: ReservationFilter; label: string; description: string }> = [
    { value: "all", label: "Tümü", description: "Geçmiş + aktif" },
    { value: "active", label: "Sadece aktif", description: "Onaylandı + Check-in" },
    { value: "past", label: "Sadece geçmiş", description: "Check-out + İptal" },
  ];

  return (
    <section className="admin-surface space-y-4 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--admin-muted)]">Takip</p>
          <h3 className="text-xl font-semibold text-[var(--admin-text-strong)]">Rezervasyon Geçmişi</h3>
          <p className="text-sm text-[var(--admin-muted)]">Tüm geçmiş ve planlanan konaklamalar.</p>
        </div>
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            className="inline-flex items-center gap-2 rounded-full border bg-[var(--admin-surface-alt)] px-4 py-2 text-sm font-semibold text-[var(--admin-text-strong)] transition hover:-translate-y-0.5 hover:border-peach-300 hover:text-peach-500 admin-border"
            aria-haspopup="true"
            aria-expanded={open}
          >
            <FilterIcon filter={filter} />
            {filterOptions.find((opt) => opt.value === filter)?.label ?? "Tümü"}
            <ChevronDown className="h-4 w-4 text-[var(--admin-muted)]" aria-hidden />
          </button>
          {open && (
            <div className="absolute right-0 z-10 mt-2 w-60 rounded-2xl border bg-[var(--admin-surface)] p-2 shadow-xl admin-border">
              {filterOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onFilterChange(option.value);
                    setOpen(false);
                  }}
                  className={clsx(
                    "flex w-full items-start gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold transition hover:bg-[var(--admin-surface-alt)]",
                    filter === option.value ? "text-peach-500" : "text-[var(--admin-text-strong)]",
                  )}
                >
                  <span className="mt-1 inline-flex h-4 w-4 items-center justify-center rounded-full border admin-border">
                    {filter === option.value && <Check className="h-3 w-3 text-peach-500" aria-hidden />}
                  </span>
                  <span className="flex-1">
                    <span className="block">{option.label}</span>
                    <span className="text-xs font-normal text-[var(--admin-muted)]">{option.description}</span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border admin-border">
        <table className="w-full text-sm">
          <thead className="bg-[var(--admin-surface-alt)] text-[11px] uppercase tracking-[0.3em] text-[var(--admin-muted)]">
            <tr>
              <th className="px-4 py-3 text-left">Rezervasyon No</th>
              <th className="px-4 py-3 text-left">Kedi</th>
              <th className="px-4 py-3 text-left">Giriş - Çıkış</th>
              <th className="px-4 py-3 text-left">Oda</th>
              <th className="px-4 py-3 text-left">Durum</th>
              <th className="px-4 py-3 text-left">Toplam Ücret</th>
            </tr>
          </thead>
          <tbody>
            {reservations.length === 0 && (
              <tr>
                <td
                  className="px-4 py-6 text-center text-sm text-[var(--admin-muted)]"
                  colSpan={6}
                >
                  Rezervasyon bulunamadi.
                </td>
              </tr>
            )}
            {reservations.map((row) => (
              <tr
                key={row.id}
                className="group cursor-pointer border-t text-[var(--admin-text-strong)] transition hover:-translate-y-[1px] hover:bg-[var(--admin-highlight-muted)]/60 hover:shadow-sm admin-border"
              >
                <td className="px-4 py-4 font-semibold text-peach-500">
                  <Link href={`/dashboard/reservations/${row.id}`} className="inline-flex items-center gap-2">
                    {row.code}
                    <ChevronRight className="h-4 w-4 text-[var(--admin-muted)] transition group-hover:text-peach-500" aria-hidden />
                  </Link>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--admin-highlight-muted)] text-peach-500">
                      {row.catAvatar ? (
                        <img src={row.catAvatar} alt={row.catName} className="h-full w-full rounded-full object-cover" />
                      ) : (
                        <Cat className="h-4 w-4" aria-hidden />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold">{row.catName}</p>
                      <p className="text-xs text-[var(--admin-muted)]">M??teri: {customerName}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <p className="font-semibold">{row.dateRange}</p>
                  <p className="text-xs text-[var(--admin-muted)]">{row.nights} gece</p>
                </td>
                <td className="px-4 py-4 text-[var(--admin-muted)]">{row.room}</td>
                <td className="px-4 py-4">
                  <StatusBadge status={row.status} />
                </td>
                <td className="px-4 py-4 font-semibold">{row.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-1 flex items-center justify-between text-xs font-semibold text-[var(--admin-muted)]">
        <span>Toplam {reservations.length} rezervasyon</span>
        <span className="inline-flex items-center gap-2 rounded-full bg-[var(--admin-surface-alt)] px-3 py-1 admin-border">
          <CalendarClock className="h-4 w-4" aria-hidden />
          Geçmiş ve aktif durumlar
        </span>
      </div>
    </section>
  );
}

function NotesPanel({ notes, onAddNote }: { notes: NoteItem[]; onAddNote: () => void }) {
  return (
    <section className="admin-surface space-y-4 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--admin-muted)]">Operasyon</p>
          <h3 className="text-xl font-semibold text-[var(--admin-text-strong)]">Notlar</h3>
          <p className="text-sm text-[var(--admin-muted)]">Sadece ekip içi görünür; düzenle / sil kısayolları sağda.</p>
        </div>
        <button
          type="button"
          onClick={onAddNote}
          className="inline-flex items-center gap-2 rounded-full border bg-[var(--admin-surface-alt)] px-4 py-2 text-sm font-semibold text-[var(--admin-text-strong)] transition hover:-translate-y-0.5 hover:border-peach-300 hover:text-peach-500 admin-border"
        >
          <Plus className="h-4 w-4" aria-hidden />
          Yeni Not Ekle
        </button>
      </div>

      <div className="space-y-3">
        {notes.length === 0 && (
          <p className="text-sm text-[var(--admin-muted)]">Not bulunamadi.</p>
        )}
        {notes.map((note) => (
          <article
            key={note.id}
            className="flex gap-3 rounded-2xl border bg-[var(--admin-surface-alt)] p-4 transition hover:-translate-y-0.5 hover:border-peach-300 admin-border"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--admin-surface)] text-peach-500 admin-border">
              {note.category === "behavior" && <PawPrint className="h-5 w-5" aria-hidden />}
              {note.category === "payment" && <Wallet className="h-5 w-5" aria-hidden />}
              {note.category === "health" && <Heart className="h-5 w-5" aria-hidden />}
              {note.category === "other" && <InfoIcon />}
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-[var(--admin-text-strong)]">{note.title}</p>
                  <p className="text-sm text-[var(--admin-muted)]">{note.text}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="rounded-full border bg-[var(--admin-surface)] p-2 text-[var(--admin-muted)] transition hover:-translate-y-0.5 hover:border-peach-300 hover:text-peach-500 admin-border"
                  >
                    <Edit3 className="h-4 w-4" aria-hidden />
                  </button>
                  <button
                    type="button"
                    className="rounded-full border bg-[var(--admin-surface)] p-2 text-[var(--admin-muted)] transition hover:-translate-y-0.5 hover:border-red-300 hover:text-red-500 admin-border"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-[var(--admin-muted)]">
                <span className="inline-flex items-center gap-2 rounded-full bg-[var(--admin-surface)] px-3 py-1 admin-border">
                  <CategoryIcon category={note.category} />
                  {formatCategory(note.category)}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-[var(--admin-surface)] px-3 py-1 admin-border">
                  <User className="h-3.5 w-3.5" aria-hidden />
                  {note.author}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-[var(--admin-surface)] px-3 py-1 admin-border">
                  <CalendarClock className="h-3.5 w-3.5" aria-hidden />
                  {note.date}
                </span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function NoteModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-xl rounded-2xl border bg-[var(--admin-surface)] p-6 shadow-2xl admin-border">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--admin-muted)]">Yeni Not</p>
            <h3 className="text-xl font-semibold text-[var(--admin-text-strong)]">Not oluştur</h3>
            <p className="text-sm text-[var(--admin-muted)]">Başlık, kategori ve açıklama girerek kaydedin.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border bg-[var(--admin-surface-alt)] p-2 text-[var(--admin-muted)] transition hover:border-peach-300 hover:text-peach-500 admin-border"
            aria-label="Kapat"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <form
          className="mt-4 space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            onClose();
          }}
        >
          <div className="space-y-2">
            <label className="text-sm font-semibold text-[var(--admin-text-strong)]" htmlFor="note-title">
              Başlık
            </label>
            <input
              id="note-title"
              name="title"
              placeholder="Mama konusunda seçici"
              className="w-full rounded-2xl border bg-[var(--admin-surface-alt)] px-3 py-2 text-sm text-[var(--admin-text-strong)] placeholder:text-[var(--admin-muted)] focus:outline-none focus:ring-2 focus:ring-peach-300 admin-border"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-[var(--admin-text-strong)]" htmlFor="note-category">
              Kategori
            </label>
            <select
              id="note-category"
              name="category"
              className="w-full rounded-2xl border bg-[var(--admin-surface-alt)] px-3 py-2 text-sm text-[var(--admin-text-strong)] focus:outline-none focus:ring-2 focus:ring-peach-300 admin-border"
              defaultValue="behavior"
            >
              <option value="behavior">Davranış</option>
              <option value="payment">Ödeme alışkanlığı</option>
              <option value="health">Sağlık</option>
              <option value="other">Diğer</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-[var(--admin-text-strong)]" htmlFor="note-text">
              Açıklama
            </label>
            <textarea
              id="note-text"
              name="text"
              rows={4}
              placeholder="Detay ekleyin..."
              className="w-full rounded-2xl border bg-[var(--admin-surface-alt)] px-3 py-2 text-sm text-[var(--admin-text-strong)] placeholder:text-[var(--admin-muted)] focus:outline-none focus:ring-2 focus:ring-peach-300 admin-border"
            />
          </div>
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border bg-[var(--admin-surface-alt)] px-4 py-2 text-sm font-semibold text-[var(--admin-muted)] transition hover:border-peach-300 hover:text-[var(--admin-text-strong)] admin-border"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-peach-400 to-lagoon-500 px-5 py-2 text-sm font-semibold text-white shadow-soft transition hover:-translate-y-0.5"
            >
              <Check className="h-4 w-4" aria-hidden />
              Kaydet
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function MenuItem({ icon, label, danger }: { icon: React.ReactNode; label: string; danger?: boolean }) {
  return (
    <button
      type="button"
      className={clsx(
        "flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold transition hover:bg-[var(--admin-surface-alt)]",
        danger ? "text-red-500 hover:text-red-500" : "text-[var(--admin-text-strong)]",
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border bg-[var(--admin-surface-alt)] px-3 py-2 admin-border">
      <span className="mt-0.5 text-[var(--admin-muted)]">{icon}</span>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--admin-muted)]">{label}</p>
        <p className="text-sm font-semibold text-[var(--admin-text-strong)]">{value}</p>
      </div>
    </div>
  );
}

function Feature({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl bg-[var(--admin-surface-alt)] px-3 py-2 text-xs font-semibold admin-border">
      {icon}
      <span className="text-[var(--admin-muted)]">{label}</span>
      <span className="text-[var(--admin-text-strong)]">{value}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: ReservationRow["status"] }) {
  const map = {
    approved: { label: "Onaylandı", classes: "bg-blue-500/15 text-blue-600 border-blue-500/30" },
    checkin: { label: "Check-in", classes: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30" },
    checkout: { label: "Check-out", classes: "bg-amber-500/15 text-amber-600 border-amber-500/30" },
    cancelled: { label: "İptal", classes: "bg-red-500/15 text-red-600 border-red-500/30" },
  } as const;
  const current = map[status];
  return (
    <span className={clsx("inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold", current.classes)}>
      <span className="h-2 w-2 rounded-full bg-current" aria-hidden />
      {current.label}
    </span>
  );
}

function FilterIcon({ filter }: { filter: ReservationFilter }) {
  if (filter === "active") {
    return <BadgeCheck className="h-4 w-4 text-emerald-500" aria-hidden />;
  }
  if (filter === "past") {
    return <CalendarClock className="h-4 w-4 text-amber-500" aria-hidden />;
  }
  return <CalendarClock className="h-4 w-4 text-[var(--admin-muted)]" aria-hidden />;
}

function CategoryIcon({ category }: { category: NoteItem["category"] }) {
  if (category === "behavior") return <PawPrint className="h-3.5 w-3.5" aria-hidden />;
  if (category === "payment") return <Wallet className="h-3.5 w-3.5" aria-hidden />;
  if (category === "health") return <Heart className="h-3.5 w-3.5" aria-hidden />;
  return <InfoIcon />;
}

function InfoIcon() {
  return <NotebookPen className="h-3.5 w-3.5 text-[var(--admin-muted)]" aria-hidden />;
}

function formatCategory(category: NoteItem["category"]) {
  if (category === "behavior") return "Davranış";
  if (category === "payment") return "Ödeme alışkanlığı";
  if (category === "health") return "Sağlık";
  return "Diğer";
}

function buildCatCards(cats: AdminCustomerDetail["cats"]): CatCard[] {
  return cats.map((cat) => {
    const tags = [cat.dietaryNotes, cat.medicalNotes]
      .map((note) => note?.trim())
      .filter((note): note is string => Boolean(note))
      .slice(0, 2);
    return {
      id: cat.id,
      name: cat.name,
      breed: cat.breed ?? "Cins bilinmiyor",
      age: calculateAge(cat.birthDate),
      weight: formatWeight(cat.weightKg),
      neutered: Boolean(cat.isNeutered),
      avatar: cat.photoUrl ?? undefined,
      tags: tags.length ? tags : undefined,
    };
  });
}

function buildReservationRows(reservations: AdminCustomerDetail["reservations"]): ReservationRow[] {
  return reservations.map((reservation) => {
    const primaryCat = reservation.cats[0];
    return {
      id: reservation.id,
      code: reservation.code,
      catName: primaryCat?.name ?? "Kedi",
      catAvatar: primaryCat?.photoUrl ?? undefined,
      dateRange: formatDateRange(reservation.checkIn, reservation.checkOut),
      nights: calculateNights(reservation.checkIn, reservation.checkOut),
      room: reservation.roomType?.name ?? "Oda bilinmiyor",
      status: mapReservationStatus(reservation.status),
      total: formatCurrency(reservation.totalPrice),
    };
  });
}

function buildNoteItems(customer?: AdminCustomerDetail | null): NoteItem[] {
  if (!customer) return [];
  const items: NoteItem[] = [];
  if (customer.notes?.trim()) {
    items.push({
      id: "customer-note",
      title: "Musteri notu",
      text: customer.notes.trim(),
      category: "other",
      author: "Sistem",
      date: formatNoteDate(customer.updatedAt),
    });
  }
  customer.cats.forEach((cat) => {
    if (cat.medicalNotes?.trim()) {
      items.push({
        id: `cat-health-${cat.id}`,
        title: `${cat.name} - saglik notu`,
        text: cat.medicalNotes.trim(),
        category: "health",
        author: "Sistem",
        date: formatNoteDate(cat.createdAt ?? customer.updatedAt),
      });
    }
    if (cat.dietaryNotes?.trim()) {
      items.push({
        id: `cat-diet-${cat.id}`,
        title: `${cat.name} - beslenme notu`,
        text: cat.dietaryNotes.trim(),
        category: "behavior",
        author: "Sistem",
        date: formatNoteDate(cat.createdAt ?? customer.updatedAt),
      });
    }
  });
  return items;
}

function mapReservationStatus(status: string): ReservationRow["status"] {
  if (status === "CHECKED_IN") return "checkin";
  if (status === "CHECKED_OUT") return "checkout";
  if (status === "CANCELLED") return "cancelled";
  return "approved";
}

function calculateAge(birthDate?: string | null) {
  if (!birthDate) return null;
  const parsed = new Date(birthDate);
  if (Number.isNaN(parsed.getTime())) return null;
  const now = new Date();
  let years = now.getFullYear() - parsed.getFullYear();
  const beforeBirthday =
    now.getMonth() < parsed.getMonth() ||
    (now.getMonth() === parsed.getMonth() && now.getDate() < parsed.getDate());
  if (beforeBirthday) years -= 1;
  return Math.max(0, years);
}

function formatAge(age: number | null) {
  if (!age && age !== 0) return "Bilinmiyor";
  if (age <= 0) return "1 yas alti";
  return `${age} yas`;
}

function formatWeight(value?: number | string | null) {
  if (value === null || value === undefined || value === "") return "Bilinmiyor";
  const numeric = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(numeric)) return "Bilinmiyor";
  return `${numeric} kg`;
}

function formatDateRange(start: string, end: string) {
  return `${formatShortDate(start)} - ${formatShortDate(end)}`;
}

function formatShortDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleDateString("tr-TR", { day: "2-digit", month: "short" });
}

function calculateNights(checkIn: string, checkOut: string) {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const diff = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
  return Math.max(1, Math.round(diff));
}

function formatCurrency(value: number | string) {
  const n = Number(value) || 0;
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

function formatNoteDate(value?: string | null) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleString("tr-TR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
