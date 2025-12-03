"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowUpDown,
  Check,
  ChevronDown,
  Copy,
  Download,
  Filter,
  Mail,
  MoreHorizontal,
  PawPrint,
  Phone,
  Search,
  UserPlus,
  X,
} from "lucide-react";
import { AdminApi } from "@/lib/api/admin";

type CustomerStatus = "ACTIVE" | "INACTIVE";
type SortKey = "name" | "cats" | "reservations" | "status" | "joinedAt";

type Customer = {
  id: string;
  name: string | null;
  email: string;
  phone?: string | null;
  catCount: number;
  totalReservations: number;
  status: CustomerStatus;
  joinedAt: string;
  lastReservationAt?: string | null;
};

type CustomerResponse = {
  items: Customer[];
  total: number;
  page: number;
  pageSize: number;
};

export default function CustomersPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<CustomerStatus | "ALL">("ALL");
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const [sort, setSort] = useState<{ key: SortKey; direction: "asc" | "desc" }>({
    key: "name",
    direction: "asc",
  });
  const [perPage, setPerPage] = useState(25);
  const [page, setPage] = useState(1);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const statusMenuRef = useRef<HTMLDivElement | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (statusMenuRef.current && !statusMenuRef.current.contains(event.target as Node)) {
        setStatusMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    function closeMenus(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      if (target?.closest("[data-customer-actions='true']")) return;
      setOpenMenuId(null);
    }
    document.addEventListener("mousedown", closeMenus);
    return () => document.removeEventListener("mousedown", closeMenus);
  }, []);

  const { data, isLoading, error, isFetching } = useQuery<CustomerResponse>({
    queryKey: ["customers", { page, perPage, searchTerm, statusFilter, sort }],
    queryFn: () =>
      AdminApi.listCustomers({
        page,
        pageSize: perPage,
        search: searchTerm || undefined,
        status: statusFilter === "ALL" ? undefined : statusFilter,
        sortBy: sort.key,
        sortDir: sort.direction,
      }),
    keepPreviousData: true,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => AdminApi.deleteCustomer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
    onError: () => {
      alert("Müşteri silinirken bir hata oluştu.");
    },
  });

  const customers = data?.items ?? [];
  const total = data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / perPage));
  const currentPage = Math.min(page, pageCount);
  const start = total === 0 ? 0 : (currentPage - 1) * perPage + 1;
  const end = total === 0 ? 0 : Math.min(start + perPage - 1, total);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, searchTerm, perPage, sort]);

  const activeFilters = useMemo(
    () =>
      [
        searchTerm ? { label: `Arama: ${searchTerm}`, onClear: () => setSearchTerm("") } : null,
        statusFilter !== "ALL"
          ? {
              label: `Durum: ${statusFilter === "ACTIVE" ? "Aktif" : "Pasif"}`,
              onClear: () => setStatusFilter("ALL"),
            }
          : null,
      ].filter(Boolean) as { label: string; onClear: () => void }[],
    [searchTerm, statusFilter],
  );

  const handleSort = (key: SortKey) => {
    setSort((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      return { key, direction: "asc" };
    });
  };

  const handleRowNavigation = (id: string) => {
    router.push(`/dashboard/customers/${id}`);
  };

  const handleExport = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const exportPageSize = Math.min(total || perPage, 1000);
      const exportData = await AdminApi.listCustomers({
        page: 1,
        pageSize: exportPageSize,
        search: searchTerm || undefined,
        status: statusFilter === "ALL" ? undefined : statusFilter,
        sortBy: sort.key,
        sortDir: sort.direction,
      });
      const rows = exportData.items.map((c) => [
        c.name ?? "İsimsiz",
        c.email,
        c.phone ?? "",
        c.catCount.toString(),
        c.totalReservations.toString(),
        statusLabel(c.status),
        formatDate(c.joinedAt),
      ]);
      const csv = [
        ["İsim", "E-posta", "Telefon", "Kedi Sayısı", "Rezervasyon", "Durum", "Kayıt Tarihi"],
        ...rows,
      ]
        .map((row) => row.map(csvEscape).join(","))
        .join("\n");

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `musteriler-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  const handleCopy = (value?: string | null) => {
    if (!value) return;
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(value).catch((err) => console.error(err));
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm(
      "Müşteriyi silmek istediğine emin misin? Bu işlemle ilişkili rezervasyon ve kedi kayıtları da silinir.",
    );
    if (!confirmed) return;
    setOpenMenuId(null);
    await deleteMutation.mutateAsync(id);
  };

  return (
    <div className="space-y-6">
      <PageHeader onExport={handleExport} disableExport={total === 0 || exporting} exporting={exporting} />
      <FilterBar
        searchTerm={searchTerm}
        onSearch={setSearchTerm}
        statusFilter={statusFilter}
        onStatusChange={(value) => {
          setStatusFilter(value);
          setStatusMenuOpen(false);
        }}
        onReset={() => {
          setSearchTerm("");
          setStatusFilter("ALL");
        }}
        statusMenuOpen={statusMenuOpen}
        setStatusMenuOpen={setStatusMenuOpen}
        statusMenuRef={statusMenuRef}
        activeFilters={activeFilters}
        fetching={isFetching}
      />
      <CustomerTable
        customers={customers}
        total={total}
        page={currentPage}
        pageCount={pageCount}
        perPage={perPage}
        onPerPageChange={(value) => setPerPage(value)}
        onPageChange={setPage}
        onSort={handleSort}
        sort={sort}
        onRowClick={handleRowNavigation}
        onCopy={handleCopy}
        openMenuId={openMenuId}
        setOpenMenuId={setOpenMenuId}
        loading={isLoading || isFetching}
        error={error instanceof Error ? error.message : null}
        onDelete={handleDelete}
      />
    </div>
  );
}

function PageHeader({
  onExport,
  disableExport,
  exporting,
}: {
  onExport: () => void;
  disableExport: boolean;
  exporting: boolean;
}) {
  return (
    <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.35em] admin-muted">Müşteri Yönetimi</p>
        <h1 className="mt-2 text-3xl font-semibold text-[var(--admin-text-strong)]">Müşteriler</h1>
        <p className="mt-1 text-sm admin-muted">Kayıtlı müşteri bilgilerini görüntüleyin ve yönetin.</p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onExport}
          disabled={disableExport}
          className={clsx(
            "inline-flex items-center gap-2 rounded-full border bg-[var(--admin-surface)] px-5 py-2.5 text-sm font-semibold text-[var(--admin-text-strong)] shadow-sm transition hover:-translate-y-0.5 hover:border-peach-300 hover:text-peach-500 admin-border",
            disableExport &&
              "cursor-not-allowed opacity-60 hover:translate-y-0 hover:border-[var(--admin-border)] hover:text-[var(--admin-text-strong)]",
          )}
        >
          <Download className="h-4 w-4 text-[var(--admin-muted)]" aria-hidden />
          {exporting ? "Dışa aktarılıyor..." : "Dışa Aktar (CSV / PDF)"}
        </button>
        <Link
          href="/dashboard/customers/new"
          className="inline-flex items-center gap-2 rounded-full bg-peach-400 px-5 py-2.5 text-sm font-semibold text-white shadow-glow transition hover:-translate-y-0.5"
        >
          <UserPlus className="h-4 w-4" aria-hidden />
          Yeni Müşteri Ekle
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
  onReset,
  statusMenuOpen,
  setStatusMenuOpen,
  statusMenuRef,
  activeFilters,
  fetching,
}: {
  searchTerm: string;
  onSearch: (value: string) => void;
  statusFilter: CustomerStatus | "ALL";
  onStatusChange: (value: CustomerStatus | "ALL") => void;
  onReset: () => void;
  statusMenuOpen: boolean;
  setStatusMenuOpen: (value: boolean) => void;
  statusMenuRef: React.RefObject<HTMLDivElement>;
  activeFilters: Array<{ label: string; onClear: () => void }>;
  fetching: boolean;
}) {
  const filtersActive = statusFilter !== "ALL" || Boolean(searchTerm.trim());

  return (
    <section className="admin-surface space-y-4 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] admin-muted">Filtre &amp; arama</p>
          <p className="text-sm text-[var(--admin-text-strong)]">
            İsim, telefon veya e-posta ile arayın; durum filtresiyle sonuçları daraltın.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {activeFilters.map((filter) => (
            <span key={filter.label} className="filter-tag">
              {filter.label}
              <button
                type="button"
                onClick={filter.onClear}
                className="rounded-full p-1 text-[var(--admin-muted)] transition hover:text-peach-400"
              >
                <X className="h-3.5 w-3.5" aria-hidden />
              </button>
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
        <div className="flex-1 rounded-2xl border bg-[var(--admin-surface-alt)] px-4 py-3 text-sm admin-border">
          <div className="flex items-center gap-3">
            <Search className="h-4 w-4 text-[var(--admin-muted)]" aria-hidden />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="İsim, telefon veya e-posta ile ara…"
              className="w-full bg-transparent text-[var(--admin-text-strong)] placeholder:text-[var(--admin-muted)] focus:outline-none"
            />
            {fetching && (
              <span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-peach-500">Canlı</span>
            )}
            {searchTerm && (
              <button
                type="button"
                onClick={() => onSearch("")}
                className="rounded-full p-1 text-[var(--admin-muted)] transition hover:text-peach-400"
                aria-label="Aramayı temizle"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative" ref={statusMenuRef}>
            <button
              type="button"
              onClick={() => setStatusMenuOpen(!statusMenuOpen)}
              className={clsx(
                "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition admin-border",
                statusFilter === "ACTIVE" && "filter-chip--active",
                statusFilter === "INACTIVE" && "bg-[var(--admin-surface-alt)] text-[var(--admin-text-strong)]",
                statusFilter === "ALL" && "bg-[var(--admin-surface)] text-[var(--admin-text-strong)]",
              )}
              aria-expanded={statusMenuOpen}
            >
              <Filter className="h-4 w-4 text-[var(--admin-muted)]" aria-hidden />
              Durum: {statusFilter === "ALL" ? "Tümü" : statusFilter === "ACTIVE" ? "Aktif" : "Pasif"}
              <ChevronDown
                className={clsx(
                  "h-4 w-4 text-[var(--admin-muted)] transition",
                  statusMenuOpen ? "rotate-180" : "rotate-0",
                )}
                aria-hidden
              />
            </button>
            {statusMenuOpen && (
              <div className="absolute right-0 z-10 mt-2 w-60 rounded-2xl border bg-[var(--admin-surface)] p-2 shadow-xl admin-border">
                {[
                  { label: "Tümü", value: "ALL" as const, description: "Tüm müşteriler" },
                  {
                    label: "Aktif Müşteriler",
                    value: "ACTIVE" as const,
                    description: "Son 1 yıl içinde rezervasyon oluşturmuş",
                  },
                  {
                    label: "Pasif Müşteriler",
                    value: "INACTIVE" as const,
                    description: "Uzun süredir işlem yapmamış",
                  },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => onStatusChange(option.value)}
                    className="flex w-full items-start gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold transition hover:bg-[var(--admin-surface-alt)]"
                  >
                    <span
                      className={clsx(
                        "mt-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full border admin-border",
                        statusFilter === option.value && "border-peach-300 bg-[var(--admin-highlight)] text-peach-500",
                      )}
                      aria-hidden
                    >
                      {statusFilter === option.value && <Check className="h-3 w-3" />}
                    </span>
                    <span className="flex-1 leading-tight">
                      <span className="block">{option.label}</span>
                      <span className="text-xs font-normal text-[var(--admin-muted)]">{option.description}</span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onReset}
            disabled={!filtersActive}
            className={clsx(
              "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition admin-border",
              filtersActive
                ? "text-[var(--admin-text-strong)] hover:-translate-y-0.5 hover:border-peach-300 hover:text-peach-500"
                : "cursor-not-allowed text-[var(--admin-muted)] opacity-60",
            )}
          >
            <X className="h-4 w-4" aria-hidden />
            Temizle
          </button>
        </div>
      </div>
    </section>
  );
}

function CustomerTable({
  customers,
  total,
  page,
  pageCount,
  perPage,
  onPerPageChange,
  onPageChange,
  onSort,
  sort,
  onRowClick,
  onCopy,
  openMenuId,
  setOpenMenuId,
  loading,
  error,
  onDelete,
}: {
  customers: Customer[];
  total: number;
  page: number;
  pageCount: number;
  perPage: number;
  onPerPageChange: (value: number) => void;
  onPageChange: (value: number) => void;
  onSort: (key: SortKey) => void;
  sort: { key: SortKey; direction: "asc" | "desc" };
  onRowClick: (id: string) => void;
  onCopy: (value?: string | null) => void;
  openMenuId: string | null;
  setOpenMenuId: (id: string | null) => void;
  loading: boolean;
  error: string | null;
  onDelete: (id: string) => void;
}) {
  const start = total === 0 ? 0 : (page - 1) * perPage + 1;
  const end = total === 0 ? 0 : Math.min(start + perPage - 1, total);

  return (
    <section className="admin-surface p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] admin-muted">Ana tablo</p>
          <h2 className="text-xl font-semibold text-[var(--admin-text-strong)]">Müşteri listesi</h2>
          <p className="text-xs admin-muted">Tüm satırlar tıklanabilir; müşteri detayına yönlendirir.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm font-semibold">
          <div className="flex items-center gap-2 rounded-full border px-3 py-1.5 admin-border">
            <span className="text-[var(--admin-muted)]">Gösterim</span>
            {[25, 50, 100].map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => onPerPageChange(size)}
                className={clsx(
                  "rounded-full px-2 py-1 transition",
                  perPage === size
                    ? "bg-[var(--admin-highlight)] text-peach-500"
                    : "text-[var(--admin-muted)] hover:text-[var(--admin-text-strong)]",
                )}
              >
                {size}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs admin-border">
            <button
              type="button"
              onClick={() => onPageChange(Math.max(1, page - 1))}
              disabled={page === 1}
              className={clsx(
                "rounded-full px-2 py-1 text-[var(--admin-muted)] transition hover:text-[var(--admin-text-strong)]",
                page === 1 && "cursor-not-allowed opacity-50",
              )}
              aria-label="Önceki sayfa"
            >
              ←
            </button>
            <span className="text-[var(--admin-text-strong)]">
              {page} / {pageCount}
            </span>
            <button
              type="button"
              onClick={() => onPageChange(Math.min(pageCount, page + 1))}
              disabled={page === pageCount}
              className={clsx(
                "rounded-full px-2 py-1 text-[var(--admin-muted)] transition hover:text-[var(--admin-text-strong)]",
                page === pageCount && "cursor-not-allowed opacity-50",
              )}
              aria-label="Sonraki sayfa"
            >
              →
            </button>
          </div>
          <span className="text-xs admin-muted">
            {start}-{end} / {total}
          </span>
        </div>
      </div>

      {error && (
        <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 dark:bg-white/10 dark:text-red-200">
          {error}
        </p>
      )}

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[980px] text-left">
          <thead>
            <tr className="text-[11px] uppercase tracking-[0.35em] text-[var(--admin-muted)]">
              <SortableHeader label="İsim" active={sort.key === "name"} direction={sort.direction} onClick={() => onSort("name")} />
              <th className="py-3 pr-3 font-semibold">Telefon</th>
              <th className="py-3 pr-3 font-semibold">Email</th>
              <SortableHeader
                label="Kedi Sayısı"
                active={sort.key === "cats"}
                direction={sort.direction}
                onClick={() => onSort("cats")}
              />
              <SortableHeader
                label="Toplam Rezervasyon"
                active={sort.key === "reservations"}
                direction={sort.direction}
                onClick={() => onSort("reservations")}
              />
              <SortableHeader
                label="Durum"
                active={sort.key === "status"}
                direction={sort.direction}
                onClick={() => onSort("status")}
              />
              <SortableHeader
                label="Kayıt"
                active={sort.key === "joinedAt"}
                direction={sort.direction}
                onClick={() => onSort("joinedAt")}
              />
              <th className="py-3 text-right font-semibold">İşlem</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {loading &&
              Array.from({ length: 5 }).map((_, idx) => (
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
                  <td className="py-4 pr-3">
                    <div className="h-4 w-20 rounded bg-[var(--admin-surface-alt)] animate-pulse" />
                  </td>
                  <td className="py-4 pr-3">
                    <div className="h-4 w-16 rounded bg-[var(--admin-surface-alt)] animate-pulse" />
                  </td>
                </tr>
              ))}

            {!loading &&
              customers.map((customer, index) => (
                <tr
                  key={customer.id}
                  className={clsx(
                    "group cursor-pointer border-t text-[var(--admin-text-strong)] transition",
                    "hover:-translate-y-[1px] hover:bg-[var(--admin-highlight-muted)]/60 hover:shadow-sm",
                    index === 0 && "border-t-0",
                  )}
                  onClick={() => onRowClick(customer.id)}
                >
                  <td className="py-4 pr-3">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--admin-highlight-muted)] text-peach-500">
                        <span className="text-sm font-semibold">{(customer.name ?? customer.email).charAt(0)}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 text-base font-semibold">
                          <span className="max-w-[220px] truncate">{customer.name ?? "İsimsiz müşteri"}</span>
                        </div>
                        <p className="mt-1 text-xs admin-muted">Kayıt tarihi: {formatDate(customer.joinedAt)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 pr-3">
                    <div className="group/phone flex items-center gap-2 text-sm font-semibold text-[var(--admin-text-strong)]">
                      <Phone className="h-4 w-4 text-[var(--admin-muted)]" aria-hidden />
                      <span>{customer.phone ?? "Telefon yok"}</span>
                      {customer.phone && (
                        <button
                          type="button"
                          className="opacity-0 transition group-hover/phone:opacity-100 text-[var(--admin-muted)] hover:text-peach-400"
                          onClick={(e) => {
                            e.stopPropagation();
                            onCopy(customer.phone);
                          }}
                          title="Kopyala"
                        >
                          <Copy className="h-4 w-4" aria-hidden />
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="py-4 pr-3">
                    <div className="group/email flex items-center gap-2 text-sm text-[var(--admin-muted)]">
                      <Mail className="h-4 w-4" aria-hidden />
                      <span className="truncate group-hover/email:underline">{customer.email}</span>
                      <button
                        type="button"
                        className="opacity-0 transition group-hover/email:opacity-100 text-[var(--admin-muted)] hover:text-peach-400"
                        onClick={(e) => {
                          e.stopPropagation();
                          onCopy(customer.email);
                        }}
                        title="Kopyala"
                      >
                        <Copy className="h-4 w-4" aria-hidden />
                      </button>
                    </div>
                  </td>
                  <td className="py-4 pr-3">
                    <span className="inline-flex items-center gap-2 rounded-full bg-[var(--admin-surface-alt)] px-3 py-1 text-xs font-semibold text-[var(--admin-text-strong)]">
                      <PawPrint className="h-4 w-4 text-peach-400" aria-hidden />
                      {customer.catCount} kedi
                    </span>
                  </td>
                  <td className="py-4 pr-3">
                    <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold admin-border">
                      <span className="h-2 w-2 rounded-full bg-[var(--admin-muted)]" aria-hidden />
                      {customer.totalReservations} rezervasyon
                    </span>
                  </td>
                  <td className="py-4 pr-3">
                    <span className="customer-status" data-status={customer.status === "ACTIVE" ? "active" : "inactive"}>
                      {statusLabel(customer.status)}
                    </span>
                  </td>
                  <td className="py-4 pr-3 text-sm font-semibold text-[var(--admin-muted)]">
                    {formatDate(customer.joinedAt)}
                  </td>
                  <td className="py-4 text-right">
                    <div className="flex items-center justify-end gap-2" data-customer-actions="true">
                      <Link
                        href={`/dashboard/customers/${customer.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold text-[var(--admin-text-strong)] transition hover:-translate-y-0.5 hover:border-peach-300 hover:text-peach-500 admin-border"
                      >
                        Detay →
                      </Link>
                      <div className="relative">
                        <button
                          type="button"
                          aria-label="Daha fazla"
                          aria-expanded={openMenuId === customer.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(openMenuId === customer.id ? null : customer.id);
                          }}
                          className="rounded-full border bg-[var(--admin-surface-alt)] p-2 text-[var(--admin-muted)] transition hover:-translate-y-0.5 hover:border-peach-300 hover:text-peach-500 admin-border"
                        >
                          <MoreHorizontal className="h-4 w-4" aria-hidden />
                        </button>
                        {openMenuId === customer.id && (
                          <div className="absolute right-0 z-10 mt-2 w-44 rounded-xl border bg-[var(--admin-surface)] p-2 text-left shadow-lg admin-border">
                            <Link
                              href={`/dashboard/customers/${customer.id}`}
                              onClick={(e) => e.stopPropagation()}
                              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-[var(--admin-text-strong)] transition hover:bg-[var(--admin-surface-alt)] hover:text-peach-500"
                            >
                              Profili Görüntüle
                            </Link>
                            <Link
                              href={`/dashboard/customers/${customer.id}/edit`}
                              onClick={(e) => e.stopPropagation()}
                              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-[var(--admin-text-strong)] transition hover:bg-[var(--admin-surface-alt)] hover:text-peach-500"
                            >
                              Düzenle
                            </Link>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDelete(customer.id);
                              }}
                              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-red-500 transition hover:bg-[var(--admin-highlight-muted)]/50"
                            >
                              Sil
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}

            {!loading && customers.length === 0 && (
              <tr>
                <td colSpan={8} className="py-6 text-center text-sm text-[var(--admin-muted)]">
                  Filtrelere uyan müşteri bulunamadı.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-col gap-2 text-sm font-semibold text-[var(--admin-muted)] sm:flex-row sm:items-center sm:justify-between">
        <span>
          Toplam {total.toLocaleString("tr-TR")} müşteri bulundu.
        </span>
        <span className="inline-flex items-center gap-2 rounded-full bg-[var(--admin-surface-alt)] px-3 py-1 text-xs font-semibold admin-border">
          <span className="h-2 w-2 rounded-full bg-peach-400" aria-hidden />
          Canlı filtre: Arama ve durum değiştiğinde tablo anında güncellenir.
        </span>
      </div>
    </section>
  );
}

function SortableHeader({
  label,
  active,
  direction,
  onClick,
}: {
  label: string;
  active: boolean;
  direction: "asc" | "desc";
  onClick: () => void;
}) {
  return (
    <th className="py-3 pr-3 font-semibold">
      <button
        type="button"
        onClick={onClick}
        className={clsx(
          "inline-flex items-center gap-1 rounded-full px-2 py-1 text-left text-[var(--admin-muted)] transition",
          active && "bg-[var(--admin-surface-alt)] text-[var(--admin-text-strong)]",
        )}
      >
        {label}
        <ArrowUpDown
          className={clsx(
            "h-3.5 w-3.5 text-[var(--admin-muted)] transition",
            active && "text-[var(--admin-text-strong)]",
            active && direction === "desc" && "rotate-180",
          )}
          aria-hidden
        />
      </button>
    </th>
  );
}

function formatDate(input: string) {
  const date = new Date(input);
  return date.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function statusLabel(status: CustomerStatus) {
  return status === "ACTIVE" ? "Aktif" : "Pasif";
}

function csvEscape(value: string) {
  const safe = value ?? "";
  if (safe.includes(",") || safe.includes("\"") || safe.includes("\n")) {
    return `"${safe.replace(/"/g, '""')}"`;
  }
  return safe;
}
