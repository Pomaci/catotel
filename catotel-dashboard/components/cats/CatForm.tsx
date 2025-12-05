"use client";

import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { CheckCircle2, Loader2, Search, Trash2 } from "lucide-react";
import { AdminApi, type AdminCatDetail, type CreateAdminCatPayload } from "@/lib/api/admin";

type CustomerSearch = {
  id: string;
  email: string;
  name?: string | null;
  phone?: string | null;
};

type CatFormProps = {
  mode: "create" | "edit";
  initialData?: Partial<AdminCatDetail>;
  onSubmit: (payload: CreateAdminCatPayload) => Promise<void>;
  submitting?: boolean;
  serverError?: string | null;
};

export function CatForm({ mode, initialData, onSubmit, submitting, serverError }: CatFormProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const [customerQuery, setCustomerQuery] = useState("");
  const [customerResults, setCustomerResults] = useState<CustomerSearch[]>([]);
  const [searching, setSearching] = useState(false);
  const [values, setValues] = useState(() => ({
    customerId: initialData?.owner?.id ?? "",
    customerLabel: initialData?.owner?.name ?? initialData?.owner?.email ?? "",
    name: initialData?.name ?? "",
    breed: initialData?.breed ?? "",
    gender: initialData?.gender ?? "UNKNOWN",
    birthDate: initialData?.birthDate ? initialData.birthDate.slice(0, 10) : "",
    isNeutered: initialData?.isNeutered ?? false,
    weightKg: initialData?.weightKg ? String(initialData.weightKg) : "",
    dietaryNotes: initialData?.dietaryNotes ?? "",
    medicalNotes: initialData?.medicalNotes ?? "",
  }));

  useEffect(() => {
    if (!customerQuery || customerQuery.trim().length < 2) {
      setCustomerResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        setSearching(true);
        const res = await AdminApi.searchCustomers(customerQuery.trim());
        setCustomerResults(res as CustomerSearch[]);
      } catch (err: any) {
        setFormError(err?.message ?? "Müşteri araması yapılamadı");
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [customerQuery]);

  const disabled = submitting || searching;

  const ownerDisplay = useMemo(() => {
    if (!values.customerId) return null;
    return values.customerLabel || "Seçilen müşteri";
  }, [values.customerId, values.customerLabel]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError(null);
    if (!values.customerId) {
      setFormError("Bir müşteri seçmelisin.");
      return;
    }
    if (!values.name.trim()) {
      setFormError("Kedi adı zorunlu.");
      return;
    }
    const payload: CreateAdminCatPayload = {
      customerId: values.customerId,
      name: values.name.trim(),
      breed: values.breed.trim() || undefined,
      gender: values.gender && values.gender !== "UNKNOWN" ? values.gender : undefined,
      birthDate: values.birthDate || undefined,
      isNeutered: values.isNeutered,
      weightKg: values.weightKg ? Number(values.weightKg) : undefined,
      dietaryNotes: values.dietaryNotes.trim() || undefined,
      medicalNotes: values.medicalNotes.trim() || undefined,
    };
    try {
      await onSubmit(payload);
    } catch (err: any) {
      setFormError(err?.message ?? "Kaydedilemedi");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-[var(--admin-text-strong)]">Müşteri</label>
          {ownerDisplay ? (
            <div className="flex items-center justify-between rounded-2xl border bg-[var(--admin-surface-alt)] px-4 py-3 text-sm font-semibold admin-border">
              <div>
                <p>{ownerDisplay}</p>
                <p className="text-xs admin-muted">ID: {values.customerId}</p>
              </div>
              <button
                type="button"
                className="rounded-full border p-2 text-[var(--admin-muted)] transition hover:text-peach-400 admin-border"
                onClick={() =>
                  setValues((prev) => ({
                    ...prev,
                    customerId: "",
                    customerLabel: "",
                  }))
                }
                aria-label="Seçimi temizle"
              >
                <Trash2 className="h-4 w-4" aria-hidden />
              </button>
            </div>
          ) : (
            <div className="rounded-2xl border bg-[var(--admin-surface-alt)] px-4 py-3 admin-border">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-[var(--admin-muted)]" aria-hidden />
                <input
                  value={customerQuery}
                  onChange={(e) => setCustomerQuery(e.target.value)}
                  placeholder="Müşteri e-posta veya adı ile ara"
                  className="h-9 w-full bg-transparent text-sm outline-none placeholder:text-[var(--admin-muted)]"
                />
                {searching && <Loader2 className="h-4 w-4 animate-spin text-peach-400" aria-hidden />}
              </div>
              {customerResults.length > 0 && (
                <div className="mt-3 space-y-2">
                  {customerResults.map((customer) => (
                    <button
                      key={customer.id}
                      type="button"
                      className="w-full rounded-xl border px-3 py-2 text-left text-sm font-semibold transition hover:border-peach-300 hover:text-peach-400 admin-border"
                      onClick={() => {
                        setValues((prev) => ({
                          ...prev,
                          customerId: customer.id,
                          customerLabel: customer.name ?? customer.email,
                        }));
                        setCustomerQuery("");
                        setCustomerResults([]);
                      }}
                    >
                      <span className="block">{customer.name ?? customer.email}</span>
                      <span className="text-xs admin-muted">
                        {customer.email}
                        {customer.phone ? ` · ${customer.phone}` : ""}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-[var(--admin-text-strong)]">Kedi adı</label>
          <input
            value={values.name}
            onChange={(e) => setValues((prev) => ({ ...prev, name: e.target.value }))}
            required
            className="w-full rounded-2xl border bg-[var(--admin-surface-alt)] px-4 py-3 text-sm font-semibold text-[var(--admin-text-strong)] admin-border focus:border-peach-300 focus:outline-none focus:ring-2 focus:ring-peach-100"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-[var(--admin-text-strong)]">Cins</label>
          <input
            value={values.breed}
            onChange={(e) => setValues((prev) => ({ ...prev, breed: e.target.value }))}
            placeholder="British Shorthair, Tekir..."
            className="w-full rounded-2xl border bg-[var(--admin-surface-alt)] px-4 py-3 text-sm font-semibold text-[var(--admin-text-strong)] admin-border focus:border-peach-300 focus:outline-none focus:ring-2 focus:ring-peach-100"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-[var(--admin-text-strong)]">Cinsiyet</label>
          <select
            value={values.gender}
            onChange={(e) => setValues((prev) => ({ ...prev, gender: e.target.value }))}
            className="w-full rounded-2xl border bg-[var(--admin-surface-alt)] px-4 py-3 text-sm font-semibold text-[var(--admin-text-strong)] admin-border focus:border-peach-300 focus:outline-none focus:ring-2 focus:ring-peach-100"
          >
            <option value="UNKNOWN">Belirsiz</option>
            <option value="MALE">Erkek</option>
            <option value="FEMALE">Dişi</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-[var(--admin-text-strong)]">Doğum tarihi</label>
          <input
            type="date"
            value={values.birthDate}
            onChange={(e) => setValues((prev) => ({ ...prev, birthDate: e.target.value }))}
            className="w-full rounded-2xl border bg-[var(--admin-surface-alt)] px-4 py-3 text-sm font-semibold text-[var(--admin-text-strong)] admin-border focus:border-peach-300 focus:outline-none focus:ring-2 focus:ring-peach-100"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-[var(--admin-text-strong)]">Ağırlık (kg)</label>
          <input
            type="number"
            step="0.1"
            min="0"
            value={values.weightKg}
            onChange={(e) => setValues((prev) => ({ ...prev, weightKg: e.target.value }))}
            className="w-full rounded-2xl border bg-[var(--admin-surface-alt)] px-4 py-3 text-sm font-semibold text-[var(--admin-text-strong)] admin-border focus:border-peach-300 focus:outline-none focus:ring-2 focus:ring-peach-100"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-[var(--admin-text-strong)]">Kısır mı?</label>
          <div className="inline-flex items-center gap-2 rounded-full border bg-[var(--admin-surface-alt)] px-3 py-2 text-xs font-semibold admin-border">
            <button
              type="button"
              className={clsx(
                "rounded-full px-3 py-1 transition",
                values.isNeutered ? "bg-peach-400 text-white shadow-glow" : "text-[var(--admin-muted)]",
              )}
              onClick={() => setValues((prev) => ({ ...prev, isNeutered: true }))}
            >
              Evet
            </button>
            <button
              type="button"
              className={clsx(
                "rounded-full px-3 py-1 transition",
                !values.isNeutered ? "bg-[var(--admin-surface)] text-[var(--admin-text-strong)] shadow-sm admin-border" : "text-[var(--admin-muted)]",
              )}
              onClick={() => setValues((prev) => ({ ...prev, isNeutered: false }))}
            >
              Hayır
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-[var(--admin-text-strong)]">Diyet notu</label>
          <textarea
            value={values.dietaryNotes}
            onChange={(e) => setValues((prev) => ({ ...prev, dietaryNotes: e.target.value }))}
            rows={3}
            className="w-full rounded-2xl border bg-[var(--admin-surface-alt)] px-4 py-3 text-sm font-semibold text-[var(--admin-text-strong)] admin-border focus:border-peach-300 focus:outline-none focus:ring-2 focus:ring-peach-100"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-[var(--admin-text-strong)]">Medikal not</label>
          <textarea
            value={values.medicalNotes}
            onChange={(e) => setValues((prev) => ({ ...prev, medicalNotes: e.target.value }))}
            rows={3}
            className="w-full rounded-2xl border bg-[var(--admin-surface-alt)] px-4 py-3 text-sm font-semibold text-[var(--admin-text-strong)] admin-border focus:border-peach-300 focus:outline-none focus:ring-2 focus:ring-peach-100"
          />
        </div>
      </div>

      {(formError || serverError) && (
        <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 dark:bg-white/5 dark:text-red-200">
          {formError || serverError}
        </div>
      )}

      <div className="flex items-center justify-end gap-3">
        <button
          type="submit"
          disabled={disabled}
          className="inline-flex items-center gap-2 rounded-full bg-peach-400 px-5 py-2 text-sm font-semibold text-white shadow-glow transition hover:-translate-y-0.5 disabled:opacity-60"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          {mode === "create" ? "Kaydı oluştur" : "Kaydı güncelle"}
          {!submitting && <CheckCircle2 className="h-4 w-4" aria-hidden />}
        </button>
      </div>
    </form>
  );
}
