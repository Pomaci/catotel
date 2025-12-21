import clsx from "clsx";
import { Home, Mail, Search, UserRound, Check } from "lucide-react";

import type { CustomerSearch } from "@/types/user";

import { Field, StepCard } from "../components";

type CustomerStepProps = {
  allowNewCustomer: boolean;
  searchTerm: string;
  searchResults: CustomerSearch[];
  searching: boolean;
  selectedCustomerId: string | null;
  onSearchChange: (value: string) => void;
  onSelectCustomer: (customer: CustomerSearch) => void;
  newCustomer: { name: string; email: string; phone: string };
  onNewCustomerChange: (field: "name" | "email" | "phone", value: string) => void;
  onCreateCustomer: () => void;
  creatingCustomer: boolean;
  customerError: string | null;
  customerSuccess: string | null;
};

export function CustomerStep({
  allowNewCustomer,
  searchTerm,
  searchResults,
  searching,
  selectedCustomerId,
  onSearchChange,
  onSelectCustomer,
  newCustomer,
  onNewCustomerChange,
  onCreateCustomer,
  creatingCustomer,
  customerError,
  customerSuccess,
}: CustomerStepProps) {
  return (
    <StepCard title="Müşteri seç / oluştur">
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3 rounded-2xl border bg-[var(--admin-surface-alt)] p-4 admin-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">Aktif / mevcut müşteriler</p>
              <p className="text-xs text-[var(--admin-muted)]">
                Arama yap veya mevcut müşteriyi seç.
              </p>
            </div>
          </div>

          <Field
            icon={<Search className="h-4 w-4" aria-hidden />}
            placeholder="E-posta, telefon veya isim ile ara"
            value={searchTerm}
            onChange={onSearchChange}
          />

          <div className="space-y-2 max-h-56 overflow-y-auto rounded-2xl bg-[var(--admin-surface)] p-2 admin-border">
            {searching && (
              <p className="px-2 text-xs text-[var(--admin-muted)]">
                Aranıyor...
              </p>
            )}
            {!searching && searchResults.length === 0 && searchTerm.trim().length >= 2 && (
              <p className="px-2 text-xs text-[var(--admin-muted)]">Sonuç yok</p>
            )}
            {!searching && searchResults.length === 0 && searchTerm.trim().length < 2 && (
              <p className="px-2 text-xs text-[var(--admin-muted)]">
                Aramak için yazmaya başla
              </p>
            )}
            {searchResults.map((cust) => (
              <button
                key={cust.id}
                type="button"
                onClick={() => onSelectCustomer(cust)}
                className={clsx(
                  "flex w-full items-center justify-between rounded-2xl px-3 py-2 text-left text-sm transition",
                  selectedCustomerId === cust.id
                    ? "bg-[var(--admin-highlight-muted)] text-[var(--admin-text-strong)]"
                    : "hover:bg-[var(--admin-highlight-muted)]/60 text-[var(--admin-text-strong)]",
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--admin-highlight-muted)] text-peach-500">
                    {(cust.name ?? cust.email ?? "M")[0]}
                  </div>
                  <div>
                    <p className="font-semibold">{cust.name ?? "İsim yok"}</p>
                    <p className="text-xs text-[var(--admin-muted)]">{cust.email}</p>
                    {cust.phone && (
                      <p className="text-[10px] text-[var(--admin-muted)]">{cust.phone}</p>
                    )}
                  </div>
                </div>
                {selectedCustomerId === cust.id && (
                  <Check className="h-4 w-4 text-peach-500" aria-hidden />
                )}
              </button>
            ))}
          </div>
        </div>

        {allowNewCustomer && (
          <div className="space-y-2 rounded-2xl border border-dashed border-[var(--admin-border)] bg-[var(--admin-surface)] p-4">
            <p className="text-sm font-semibold">Yeni müşteri ekle</p>
            <Field
              icon={<UserRound className="h-4 w-4" aria-hidden />}
              placeholder="Ad Soyad"
              value={newCustomer.name}
              onChange={(v) => onNewCustomerChange("name", v)}
            />
            <Field
              icon={<Mail className="h-4 w-4" aria-hidden />}
              placeholder="E-posta"
              value={newCustomer.email}
              onChange={(v) => onNewCustomerChange("email", v)}
            />
            <Field
              icon={<Home className="h-4 w-4" aria-hidden />}
              placeholder="Telefon"
              value={newCustomer.phone}
              onChange={(v) => onNewCustomerChange("phone", v)}
            />
            {customerError && (
              <p className="text-xs font-semibold text-red-500">{customerError}</p>
            )}
            {customerSuccess && (
              <p className="text-xs font-semibold text-emerald-600">{customerSuccess}</p>
            )}
            <button
              type="button"
              onClick={onCreateCustomer}
              disabled={creatingCustomer}
              className="inline-flex items-center gap-2 rounded-full bg-peach-400 px-4 py-2 text-xs font-semibold text-white shadow-glow transition hover:-translate-y-0.5 disabled:opacity-60"
            >
              {creatingCustomer ? "Oluşturuluyor..." : "Müşteri Oluştur"}
            </button>
          </div>
        )}
      </div>
    </StepCard>
  );
}
