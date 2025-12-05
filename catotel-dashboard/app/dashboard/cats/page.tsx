"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpDown,
  Cat,
  CheckCircle2,
  Download,
  Filter,
  Mars,
  Minus,
  MoreHorizontal,
  PawPrint,
  Plus,
  Search,
  Venus,
  X,
} from "lucide-react";
import { AdminApi, type AdminCatListResponse } from "@/lib/api/admin";

type GenderFilter = "ALL" | "MALE" | "FEMALE";
type NeuterFilter = "ALL" | "NEUTERED" | "INTACT";
type SortKey = "name" | "owner" | "breed" | "gender" | "neutered";

export default function CatsPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [genderFilter, setGenderFilter] = useState<GenderFilter>("ALL");
  const [neuterFilter, setNeuterFilter] = useState<NeuterFilter>("ALL");
  const [sort, setSort] = useState<{ key: SortKey; direction: "asc" | "desc" }>({
    key: "name",
    direction: "asc",
  });
  const [perPage, setPerPage] = useState(25);
  const [page, setPage] = useState(1);

  const queryParams = useMemo(
    () => ({
      page,
      pageSize: perPage,
      search: searchTerm.trim() || undefined,
      gender: genderFilter === "ALL" ? undefined : genderFilter,
      neutered: neuterFilter === "ALL" ? undefined : neuterFilter === "NEUTERED",
      sortBy: sort.key,
      sortDir: sort.direction,
    }),
    [genderFilter, neuterFilter, page, perPage, searchTerm, sort],
  );

  const { data, isLoading, isFetching, error } = useQuery<AdminCatListResponse>({
    queryKey: ["admin-cats", queryParams],
    queryFn: () => AdminApi.listCats(queryParams),
    keepPreviousData: true,
  });

  const cats = data?.items ?? [];
  const total = data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / perPage));
  const currentPage = Math.min(page, pageCount);

  useEffect(() => {
    setPage(1);
  }, [genderFilter, neuterFilter, perPage, searchTerm, sort]);

  const activeFilters = [
    searchTerm
      ? {
          label: `Arama: ${searchTerm}`,
          onClear: () => setSearchTerm(""),
        }
      : null,
    genderFilter !== "ALL"
      ? {
          label: `Cinsiyet: ${genderFilter === "MALE" ? "Erkek" : "Dişi"}`,
          onClear: () => setGenderFilter("ALL"),
        }
      : null,
    neuterFilter !== "ALL"
      ? {
          label: `Kısır: ${neuterFilter === "NEUTERED" ? "Evet" : "Hayır"}`,
          onClear: () => setNeuterFilter("ALL"),
        }
      : null,
  ].filter(Boolean) as { label: string; onClear: () => void }[];

  const handleSort = (key: SortKey) => {
    setSort((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      return { key, direction: "asc" };
    });
  };

  const handleRowClick = (id: string) => {
    router.push(`/dashboard/cats/${id}`);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.4em] admin-muted">Kedi Operasyon</p>
          <h1 className="mt-1 text-3xl font-semibold">Kediler</h1>
          <p className="mt-1 text-sm admin-muted">Kayıtlı kedileri görüntüleyin ve yönetin.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full border bg-[var(--admin-surface)] px-4 py-2 text-sm font-semibold text-[var(--admin-text-strong)] transition hover:-translate-y-0.5 hover:border-peach-300 hover:text-peach-400 admin-border"
          >
            <Download className="h-4 w-4" aria-hidden />
            Dışa Aktar
          </button>
          <button
            type="button"
            onClick={() => router.push("/dashboard/cats/new")}
            className="inline-flex items-center gap-2 rounded-full bg-peach-400 px-4 py-2 text-sm font-semibold text-white shadow-glow transition hover:-translate-y-0.5"
          >
            <Plus className="h-4 w-4" aria-hidden />
            Yeni Kedi Ekle
          </button>
        </div>
      </header>

      <section className="admin-surface p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-col gap-3 lg:flex-row lg:items-center">
            <div className="flex min-w-[260px] flex-1 items-center gap-2 rounded-2xl border bg-[var(--admin-surface-alt)] px-4 py-3 transition focus-within:border-peach-300 focus-within:ring-2 focus-within:ring-peach-100 admin-border">
              <Search className="h-4 w-4 text-[var(--admin-muted)]" aria-hidden />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Kedi adı veya sahibi adı ile ara…"
                className="h-9 w-full bg-transparent text-sm font-medium outline-none placeholder:text-[var(--admin-muted)]"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  aria-label="Aramayı temizle"
                  className="rounded-full p-1 text-[var(--admin-muted)] transition hover:bg-[var(--admin-surface)] hover:text-peach-400"
                >
                  <X className="h-4 w-4" aria-hidden />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Dropdown
                label="Cinsiyet"
                value={genderFilter}
                onChange={setGenderFilter}
                options={[
                  { label: "Tümü", value: "ALL" },
                  { label: "Erkek", value: "MALE" },
                  { label: "Dişi", value: "FEMALE" },
                ]}
              />
              <Dropdown
                label="Kısır / değil"
                value={neuterFilter}
                onChange={setNeuterFilter}
                options={[
                  { label: "Tümü", value: "ALL" },
                  { label: "Kısır", value: "NEUTERED" },
                  { label: "Kısır değil", value: "INTACT" },
                ]}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                setGenderFilter("ALL");
                setNeuterFilter("ALL");
              }}
              className="inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold text-[var(--admin-text-strong)] transition hover:-translate-y-0.5 hover:border-peach-300 hover:text-peach-400 admin-border"
            >
              <Filter className="h-4 w-4" aria-hidden />
              Temizle
            </button>
          </div>
        </div>

        {activeFilters.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.3em] admin-muted">Aktif filtreler</span>
            {activeFilters.map((filter) => (
              <button
                key={filter.label}
                type="button"
                onClick={filter.onClear}
                className="filter-tag"
              >
                {filter.label}
                <X className="h-4 w-4 text-[var(--admin-muted)]" aria-hidden />
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="admin-surface p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.4em] admin-muted">Kayıt listesi</p>
            <h2 className="text-xl font-semibold">Kedi tablosu</h2>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm font-semibold text-[var(--admin-muted)]">
            <PerPageSelector value={perPage} onChange={setPerPage} />
            <Pagination currentPage={currentPage} pageCount={pageCount} onChange={setPage} />
            {pageCount > 4 && (
              <span className="rounded-full bg-[var(--admin-surface-alt)] px-3 py-1 text-xs font-semibold admin-border">
                Sayfa {currentPage} / {pageCount}
              </span>
            )}
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead>
              <tr className="border-b text-[11px] uppercase tracking-[0.3em] admin-muted admin-border">
                <SortableHeader label="Kedi adı" sortKey="name" currentSort={sort} onSort={handleSort} />
                <SortableHeader label="Sahibi" sortKey="owner" currentSort={sort} onSort={handleSort} />
                <SortableHeader label="Cins" sortKey="breed" currentSort={sort} onSort={handleSort} />
                <SortableHeader label="Cinsiyet" sortKey="gender" currentSort={sort} onSort={handleSort} />
                <SortableHeader label="Kısır mı" sortKey="neutered" currentSort={sort} onSort={handleSort} />
                <th className="py-3 pr-3 text-right font-semibold">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <TableSkeleton />
              ) : (
                cats.map((cat) => (
                  <tr
                    key={cat.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleRowClick(cat.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleRowClick(cat.id);
                      }
                    }}
                    className="group border-b last:border-none transition hover:-translate-y-0.5 hover:bg-[var(--admin-surface-alt)] admin-border"
                  >
                    <td className="py-4 pr-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-11 w-11 items-center justify-center rounded-full text-white shadow-sm transition duration-200 group-hover:scale-105"
                          style={{ backgroundImage: avatarAccent(cat.id) }}
                        >
                          <Cat className="h-5 w-5" aria-hidden />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 text-base font-semibold text-[var(--admin-text-strong)]">
                            <span className="max-w-[200px] truncate">{cat.name}</span>
                            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--admin-surface-alt)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] admin-border">
                              <PawPrint className="h-3 w-3 text-peach-400" aria-hidden />
                              #{cat.id.slice(-4)}
                            </span>
                          </div>
                          <p className="mt-1 text-xs admin-muted">
                            {cat.birthDate ? `Doğum: ${birthYear(cat.birthDate)}` : "Doğum bilinmiyor"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 pr-3">
                      <div className="flex flex-col">
                        <button
                          type="button"
                          className="text-sm font-semibold text-[var(--admin-text-strong)] transition hover:text-peach-400 hover:underline"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push("/dashboard/customers");
                          }}
                        >
                          {cat.owner.name ?? cat.owner.email}
                        </button>
                        <span className="text-xs admin-muted">{cat.owner.phone ?? cat.owner.email}</span>
                      </div>
                    </td>
                    <td className="py-4 pr-3 text-sm font-semibold text-[var(--admin-muted)]">{cat.breed ?? "–"}</td>
                    <td className="py-4 pr-3">
                      <Badge variant={cat.gender === "MALE" ? "male" : cat.gender === "FEMALE" ? "female" : "muted"}>
                        {cat.gender === "MALE" ? (
                          <Mars className="h-3.5 w-3.5" aria-hidden />
                        ) : cat.gender === "FEMALE" ? (
                          <Venus className="h-3.5 w-3.5" aria-hidden />
                        ) : (
                          <Minus className="h-3.5 w-3.5" aria-hidden />
                        )}
                        {genderLabel(cat.gender)}
                      </Badge>
                    </td>
                    <td className="py-4 pr-3">
                      <Badge variant={cat.isNeutered ? "positive" : "muted"}>
                        {cat.isNeutered ? <CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> : <Minus className="h-3.5 w-3.5" aria-hidden />}
                        {cat.isNeutered ? "Evet" : "Hayır"}
                      </Badge>
                    </td>
                    <td className="py-4 pr-3">
                      <div className="flex items-center justify-end gap-2 text-xs font-semibold">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRowClick(cat.id);
                          }}
                          className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[var(--admin-text-strong)] transition hover:-translate-y-0.5 hover:border-peach-300 hover:text-peach-400 admin-border"
                        >
                          Detay →
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/dashboard/cats/${cat.id}/edit`);
                          }}
                          className="rounded-full border bg-[var(--admin-surface-alt)] p-2 text-[var(--admin-muted)] transition hover:-translate-y-0.5 hover:border-peach-300 hover:text-peach-400 admin-border"
                          aria-label="Düzenle"
                        >
                          <MoreHorizontal className="h-4 w-4" aria-hidden />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}

              {!isLoading && cats.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-sm text-[var(--admin-muted)]">
                    Filtrelere uyan kedi bulunamadı.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {error && (
          <div className="mt-3 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 dark:bg-white/5 dark:text-red-200">
            Veri alınırken hata oluştu: {(error as Error).message}
          </div>
        )}

        <div className="mt-4 flex flex-col gap-2 text-sm font-semibold text-[var(--admin-muted)] sm:flex-row sm:items-center sm:justify-between">
          <span>Toplam {total.toLocaleString("tr-TR")} kedi bulundu.</span>
          <span className="inline-flex items-center gap-2 rounded-full bg-[var(--admin-surface-alt)] px-3 py-1 text-xs font-semibold admin-border">
            <span className="h-2 w-2 rounded-full bg-peach-400" aria-hidden />
            Satır tıklanınca detay sayfasına gider. {isFetching && " (Tablo güncelleniyor...)"}
          </span>
        </div>
      </section>
    </div>
  );
}

function Dropdown<TValue extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: TValue;
  onChange: (value: TValue) => void;
  options: { label: string; value: TValue }[];
}) {
  return (
    <label className="flex items-center gap-2">
      <span className="text-xs font-semibold uppercase tracking-[0.2em] admin-muted">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as TValue)}
        className="min-w-[140px] rounded-2xl border bg-[var(--admin-surface-alt)] px-3 py-2 text-sm font-semibold text-[var(--admin-text-strong)] shadow-inner transition focus:border-peach-300 focus:outline-none focus:ring-2 focus:ring-peach-100 admin-border"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function SortableHeader({
  label,
  sortKey,
  currentSort,
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  currentSort: { key: SortKey; direction: "asc" | "desc" };
  onSort: (key: SortKey) => void;
}) {
  const active = currentSort.key === sortKey;
  return (
    <th className="py-3 pr-3 font-semibold">
      <button
        type="button"
        onClick={() => onSort(sortKey)}
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
            active && currentSort.direction === "desc" && "rotate-180",
          )}
          aria-hidden
        />
      </button>
    </th>
  );
}

function Badge({
  variant,
  children,
}: {
  variant: "male" | "female" | "positive" | "muted";
  children: ReactNode;
}) {
  const styles: Record<"male" | "female" | "positive" | "muted", string> = {
    male: "bg-[rgba(59,130,246,0.15)] text-[#2563eb] border-[rgba(59,130,246,0.2)]",
    female: "bg-[rgba(236,72,153,0.15)] text-[#be185d] border-[rgba(236,72,153,0.25)]",
    positive: "bg-[rgba(34,197,94,0.16)] text-[#15803d] border-[rgba(34,197,94,0.25)]",
    muted: "bg-[rgba(148,163,184,0.18)] text-[#475569] border-[rgba(148,163,184,0.35)]",
  };

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold",
        styles[variant],
      )}
    >
      {children}
    </span>
  );
}

function Pagination({
  currentPage,
  pageCount,
  onChange,
}: {
  currentPage: number;
  pageCount: number;
  onChange: (page: number) => void;
}) {
  const pages = Array.from({ length: Math.min(pageCount, 4) }, (_, index) => index + 1);
  return (
    <div className="flex items-center gap-2 rounded-full border bg-[var(--admin-surface-alt)] px-3 py-1 text-xs font-semibold admin-border">
      <button
        type="button"
        className="rounded-full p-1 text-[var(--admin-muted)] transition hover:text-peach-400 disabled:opacity-50"
        onClick={() => onChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        aria-label="Önceki sayfa"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
      </button>
      {pages.map((page) => (
        <button
          key={page}
          type="button"
          onClick={() => onChange(page)}
          className={clsx(
            "h-8 w-8 rounded-full text-center transition",
            page === currentPage
              ? "bg-peach-400 text-white shadow-glow"
              : "text-[var(--admin-muted)] hover:text-peach-400",
          )}
        >
          {page}
        </button>
      ))}
      <button
        type="button"
        className="rounded-full p-1 text-[var(--admin-muted)] transition hover:text-peach-400 disabled:opacity-50"
        onClick={() => onChange(Math.min(pageCount, currentPage + 1))}
        disabled={currentPage === pageCount}
        aria-label="Sonraki sayfa"
      >
        <ArrowRight className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}

function PerPageSelector({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border bg-[var(--admin-surface-alt)] px-3 py-1 text-xs font-semibold admin-border">
      <span className="text-[var(--admin-muted)]">Sayfa başına</span>
      {[25, 50, 100].map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={clsx(
            "rounded-full px-2 py-1 transition",
            option === value
              ? "bg-peach-400 text-white shadow-glow"
              : "text-[var(--admin-muted)] hover:text-peach-400",
          )}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, index) => (
        // eslint-disable-next-line react/no-array-index-key
        <tr key={index} className="border-b last:border-none admin-border">
          <td colSpan={6} className="py-4">
            <div className="flex items-center gap-3">
              <span className="h-11 w-11 rounded-full bg-[var(--admin-surface-alt)] animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-1/3 rounded-full bg-[var(--admin-surface-alt)] animate-pulse" />
                <div className="h-3 w-1/5 rounded-full bg-[var(--admin-surface-alt)] animate-pulse" />
              </div>
            </div>
          </td>
        </tr>
      ))}
    </>
  );
}

function avatarAccent(seed: string) {
  const palette = [
    "linear-gradient(135deg, #ffe1cc, #ffb673)",
    "linear-gradient(135deg, #d3e7ff, #9ec5ff)",
    "linear-gradient(135deg, #f5d0fe, #fcd6ff)",
    "linear-gradient(135deg, #c8f7e4, #8be0c1)",
    "linear-gradient(135deg, #fde68a, #fdba74)",
    "linear-gradient(135deg, #bde0fe, #a5d8ff)",
    "linear-gradient(135deg, #ffd7ba, #ffaf87)",
    "linear-gradient(135deg, #e0f2fe, #c7d2fe)",
  ];
  const hash = seed.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return palette[hash % palette.length];
}

function birthYear(date?: string | null) {
  if (!date) return "—";
  return new Date(date).getFullYear();
}

function genderLabel(gender?: string | null) {
  if (gender === "MALE") return "Erkek";
  if (gender === "FEMALE") return "Dişi";
  return "Bilinmiyor";
}
