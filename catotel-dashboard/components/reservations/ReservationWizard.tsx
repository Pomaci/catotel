"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import {
  CalendarRange,
  Check,
  ChevronLeft,
  ChevronRight,
  Home,
  Search,
  Mail,
  PawPrint,
  Plus,
  UserRound,
} from "lucide-react";
import type { Cat, Reservation, Room } from "@/types/hotel";
import { AdminApi } from "@/lib/api/admin";
import { HotelApi } from "@/lib/api/hotel";
import type { CustomerSearch } from "@/types/user";

type StepKey = "customer" | "cats" | "dates" | "pricing";
const stepOrder: StepKey[] = ["customer", "cats", "dates", "pricing"];

type WizardValues = {
  roomId: string | null;
  catIds: string[];
  checkIn: string;
  checkOut: string;
  specialRequests?: string;
  customerId?: string | null;
};

export function ReservationWizard({
  mode = "create",
  rooms = [],
  cats = [],
  initialReservation,
  customerName,
  onSubmitAction,
  submitting,
  allowNewCustomer = false,
  customerCreatedCallbackAction,
  initialStep,
}: {
  mode?: "create" | "edit";
  rooms?: Room[];
  cats?: Cat[];
  initialReservation?: Reservation | null;
  customerName?: string | null;
  onSubmitAction?: (values: WizardValues) => Promise<void>;
  submitting?: boolean;
  allowNewCustomer?: boolean;
  customerCreatedCallbackAction?: (nameOrEmail: string) => void;
  initialStep?: StepKey;
}) {
  const isEdit = mode === "edit";
  const reservationCustomerId =
    (initialReservation as any)?.customerId ??
    (initialReservation as any)?.customer?.id ??
    initialReservation?.customer?.user.id ??
    null;

  const defaultStep: StepKey = initialStep ?? (isEdit ? "cats" : "customer");
  const [step, setStep] = useState<StepKey>(defaultStep);
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(
    customerName ?? null
  );
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(
    reservationCustomerId
  );
  const [selectedCats, setSelectedCats] = useState<string[]>(
    initialReservation?.cats.map((c) => c.cat.id) ?? []
  );
  const [selectedRoom, setSelectedRoom] = useState<string | null>(
    initialReservation?.room.id ?? null
  );
  const [checkIn, setCheckIn] = useState(
    initialReservation?.checkIn.slice(0, 10) ?? ""
  );
  const [checkOut, setCheckOut] = useState(
    initialReservation?.checkOut.slice(0, 10) ?? ""
  );
  const [notes, setNotes] = useState(initialReservation?.specialRequests ?? "");
  const [wizardError, setWizardError] = useState<string | null>(null);
  const [newCatForm, setNewCatForm] = useState({ name: "", breed: "" });

  const [newCustomer, setNewCustomer] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [creatingCustomer, setCreatingCustomer] = useState(false);
  const [customerError, setCustomerError] = useState<string | null>(null);
  const [customerSuccess, setCustomerSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<CustomerSearch[]>([]);
  const [searching, setSearching] = useState(false);
  const todayIso = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const {
    data: customerCats = [],
    isFetching: loadingCustomerCats,
    refetch: refetchCustomerCats,
  } = useQuery({
    queryKey: ["customer-cats", selectedCustomerId],
    enabled: Boolean(selectedCustomerId),
    queryFn: () => AdminApi.listCustomerCats(selectedCustomerId!),
  });

  const createCustomerCat = useMutation({
    mutationFn: (payload: { name: string; breed?: string }) =>
      AdminApi.createCustomerCat(selectedCustomerId!, payload),
    onSuccess: async () => {
      setNewCatForm({ name: "", breed: "" });
      await refetchCustomerCats();
    },
    onError: (err: any) => setWizardError(err?.message ?? "Kedi eklenemedi"),
  });

  const { data: availabilityRooms, isFetching: loadingAvailability } = useQuery({
    queryKey: ["rooms-availability", checkIn, checkOut],
    enabled: Boolean(checkIn && checkOut),
    queryFn: () => HotelApi.listRooms(false, checkIn, checkOut),
  });

  useEffect(() => {
    if (initialReservation) {
      setSelectedRoom(initialReservation.room.id);
      setSelectedCats(initialReservation.cats.map((c) => c.cat.id));
      setCheckIn(initialReservation.checkIn.slice(0, 10));
      setCheckOut(initialReservation.checkOut.slice(0, 10));
      setNotes(initialReservation.specialRequests ?? "");
      setSelectedCustomer(
        initialReservation.customer?.user.name ??
          initialReservation.customer?.user.email ??
          null
      );
      setSelectedCustomerId(reservationCustomerId);
      if (isEdit && initialStep) {
        setStep(initialStep);
      } else if (isEdit) {
        setStep("cats");
      }
    }
  }, [initialReservation, isEdit, reservationCustomerId, initialStep]);

  async function handleCreateCustomer() {
    setCustomerError(null);
    setCustomerSuccess(null);
    if (!newCustomer.email.trim()) {
      setCustomerError("E-posta zorunlu");
      return;
    }
    let created: Awaited<ReturnType<typeof AdminApi.createCustomer>> | undefined;
    try {
      setCreatingCustomer(true);
      created = await AdminApi.createCustomer({
        email: newCustomer.email.trim(),
        name: newCustomer.name.trim() || undefined,
        phone: newCustomer.phone.trim() || undefined,
      });
      setSelectedCustomer(created.name ?? created.email);
      setSelectedCustomerId(created.id ?? null);
      setCustomerError(null);
      setCustomerSuccess("Yeni musteri olusturuldu");
    } catch (err: any) {
      setCustomerError(err?.message ?? "M��teri olu�turulamad�");
      setCustomerSuccess(null);
    } finally {
      setCreatingCustomer(false);
    }
    if (customerCreatedCallbackAction && created?.email) {
      customerCreatedCallbackAction(created.name ?? created.email);
    }
  }
  async function handleSearch(term: string) {
    setSearchTerm(term);
    setCustomerError(null);
    setWizardError(null);
    const normalized = term.trim();
    if (!normalized || normalized.length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      setSearching(true);
      const res = await AdminApi.searchCustomers(normalized);
      setSearchResults(res as CustomerSearch[]);
    } catch (err: any) {
      setCustomerError(err?.message ?? "Müşteri araması yapılamadı");
    } finally {
      setSearching(false);
    }
  }

  const hasCustomerSelected = Boolean(selectedCustomerId || selectedCustomer);
  const hasSelectedCats = selectedCats.length > 0;
  const isCheckInBeforeToday = checkIn && checkIn < todayIso;
  const isCheckOutBeforeCheckIn = checkIn && checkOut && checkOut <= checkIn;
  const nightCount = useMemo(() => {
    if (!checkIn || !checkOut) return null;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffDays = Math.ceil(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    );
    return diffDays > 0 ? diffDays : null;
  }, [checkIn, checkOut]);
  const roomList = availabilityRooms ?? rooms ?? [];

  const validationMessageForStep = (currentStep: StepKey) => {
    if (currentStep === "customer" && !hasCustomerSelected)
      return "Lütfen müşteri seç.";
    if (currentStep === "cats") {
      if (!hasCustomerSelected) return "Önce müşteri seçmelisin.";
      if (!hasSelectedCats) return "En az bir kedi seçmelisin.";
    }
    if (currentStep === "dates") {
      if (!hasSelectedCats) return "Önce kedi seçmelisin.";
      if (!checkIn || !checkOut)
        return "Giriş ve çıkış tarihlerini seçmelisin.";
      if (isCheckInBeforeToday) return "Giriş tarihi bugünden önce olamaz.";
      if (isCheckOutBeforeCheckIn)
        return "Çıkış tarihi giriş tarihinden sonra olmalı.";
      if (!selectedRoom) return "Lütfen oda seç.";
    }
    return null;
  };

  const goNext = () => {
    const reason = validationMessageForStep(step);
    if (reason) {
      setWizardError(reason);
      return;
    }
    const next = stepOrder[stepOrder.indexOf(step) + 1];
    if (next) {
      setWizardError(null);
      setStep(next);
    }
  };
  const goPrev = () => {
    const prev = stepOrder[stepOrder.indexOf(step) - 1];
    if (!prev) return;
    if (isEdit && prev === "customer") return;
    setWizardError(null);
    setStep(prev);
  };

  const combinedCats: Cat[] = [
    ...(customerCats as Cat[]),
    ...(initialReservation?.cats?.map((c) => c.cat) ?? []),
    ...(cats ?? []),
  ];
  const availableCats: Cat[] = Array.from(
    new Map(combinedCats.filter(Boolean).map((c) => [c.id, c])).values()
  );
  const nextDisabled =
    validationMessageForStep(step) !== null || step === "pricing";

  return (
    <div className="admin-surface space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--admin-muted)]">
            {mode === "create" ? "Yeni rezervasyon" : "Rezervasyonu düzenle"}
          </p>
          <h2 className="text-xl font-semibold text-[var(--admin-text-strong)]">
            4 Adımda {mode === "create" ? "Oluştur" : "Güncelle"}
          </h2>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full bg-peach-400 px-4 py-2 text-sm font-semibold text-white shadow-glow transition hover:-translate-y-0.5 disabled:opacity-60"
            disabled={!onSubmitAction || submitting}
            onClick={async () => {
              if (!onSubmitAction) return;
              const reason =
                validationMessageForStep("dates") ||
                validationMessageForStep("cats") ||
                validationMessageForStep("customer");
              if (reason) {
                setWizardError(reason);
                return;
              }
              await onSubmitAction({
                roomId: selectedRoom,
                catIds: selectedCats,
                checkIn,
                checkOut,
                specialRequests: notes,
                customerId: selectedCustomerId,
              });
            }}
          >
            {submitting
              ? "Kaydediliyor..."
              : mode === "create"
              ? "Rezervasyonu Oluştur"
              : "Değişiklikleri Kaydet"}
          </button>
        </div>
      </div>

      <Stepper current={step} />
      {wizardError && (
        <p className="text-sm font-semibold text-red-500">{wizardError}</p>
      )}

      {!isEdit && step === "customer" && (
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
                onChange={handleSearch}
              />

              <div className="space-y-2 max-h-56 overflow-y-auto rounded-2xl bg-[var(--admin-surface)] p-2 admin-border">
                {searching && (
                  <p className="px-2 text-xs text-[var(--admin-muted)]">
                    Aranıyor...
                  </p>
                )}
                {!searching &&
                  searchResults.length === 0 &&
                  searchTerm.trim().length >= 2 && (
                    <p className="px-2 text-xs text-[var(--admin-muted)]">
                      Sonuç yok
                    </p>
                  )}
                {!searching &&
                  searchResults.length === 0 &&
                  searchTerm.trim().length < 2 && (
                    <p className="px-2 text-xs text-[var(--admin-muted)]">
                      Aramak için yazmaya başla
                    </p>
                  )}
                {searchResults.map((cust) => (
                  <button
                    key={cust.id}
                    type="button"
                    onClick={() => {
                      setSelectedCustomer(cust.name ?? cust.email);
                      setSelectedCustomerId(cust.id);
                    }}
                    className={clsx(
                      "flex w-full items-center justify-between rounded-2xl px-3 py-2 text-left text-sm transition",
                      selectedCustomer === (cust.name ?? cust.email)
                        ? "bg-[var(--admin-highlight-muted)] text-[var(--admin-text-strong)]"
                        : "hover:bg-[var(--admin-highlight-muted)]/60 text-[var(--admin-text-strong)]"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--admin-highlight-muted)] text-peach-500">
                        {(cust.name ?? cust.email ?? "M")[0]}
                      </div>
                      <div>
                        <p className="font-semibold">{cust.name ?? "İsim yok"}</p>
                        <p className="text-xs text-[var(--admin-muted)]">
                          {cust.email}
                        </p>
                        {cust.phone && (
                          <p className="text-[10px] text-[var(--admin-muted)]">
                            {cust.phone}
                          </p>
                        )}
                      </div>
                    </div>
                    {selectedCustomer === (cust.name ?? cust.email) && (
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
                  onChange={(v) => setNewCustomer((s) => ({ ...s, name: v }))}
                />
                <Field
                  icon={<Mail className="h-4 w-4" aria-hidden />}
                  placeholder="E-posta"
                  value={newCustomer.email}
                  onChange={(v) => setNewCustomer((s) => ({ ...s, email: v }))}
                />
                <Field
                  icon={<Home className="h-4 w-4" aria-hidden />}
                  placeholder="Telefon"
                  value={newCustomer.phone}
                  onChange={(v) => setNewCustomer((s) => ({ ...s, phone: v }))}
                />
                {customerError && (
                  <p className="text-xs font-semibold text-red-500">
                    {customerError}
                  </p>
                )}
                {customerSuccess && (
                  <p className="text-xs font-semibold text-emerald-600">
                    {customerSuccess}
                  </p>
                )}
                <button
                  type="button"
                  onClick={handleCreateCustomer}
                  disabled={creatingCustomer}
                  className="inline-flex items-center gap-2 rounded-full bg-peach-400 px-4 py-2 text-xs font-semibold text-white shadow-glow transition hover:-translate-y-0.5 disabled:opacity-60"
                >
                  {creatingCustomer ? "Oluşturuluyor..." : "Müşteri Oluştur"}
                </button>
              </div>
            )}
          </div>
        </StepCard>
      )}

      {step === "cats" && (
        <StepCard title="Kedi seçimi">
          {!hasCustomerSelected ? (
            <p className="text-sm text-[var(--admin-muted)]">
              �lerlemek i�in �nce m��teri se�.
            </p>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-3 rounded-2xl border bg-[var(--admin-surface-alt)] p-4 admin-border">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">Müşterinin kedileri</p>
                  {loadingCustomerCats && (
                    <span className="text-xs text-[var(--admin-muted)]">
                      Yükleniyor...
                    </span>
                  )}
                </div>
                {availableCats.length === 0 && (
                  <p className="text-xs text-[var(--admin-muted)]">
                    Henüz kedi eklenmemiş.
                  </p>
                )}
                <div className="grid gap-3">
                  {availableCats.map((cat) => {
                    const checked = selectedCats.includes(cat.id);
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() =>
                          setSelectedCats((prev) =>
                            prev.includes(cat.id)
                              ? prev.filter((c) => c !== cat.id)
                              : [...prev, cat.id]
                          )
                        }
                        className={clsx(
                          "flex items-center justify-between rounded-2xl border px-4 py-3 text-left transition admin-border",
                          checked
                            ? "border-peach-300 bg-[var(--admin-highlight-muted)]"
                            : "hover:border-peach-200"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--admin-highlight-muted)] text-peach-500">
                            <PawPrint className="h-4 w-4" aria-hidden />
                          </div>
                          <div>
                            <p className="text-sm font-semibold">{cat.name}</p>
                            <p className="text-xs text-[var(--admin-muted)]">
                              {cat.breed ?? "Cins bilinmiyor"}
                            </p>
                          </div>
                        </div>
                        {checked && (
                          <Check className="h-4 w-4 text-peach-500" aria-hidden />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-3 rounded-2xl border border-dashed border-[var(--admin-border)] bg-[var(--admin-surface)] p-4">
                <p className="text-sm font-semibold">Yeni kedi ekle</p>
                <Field
                  icon={<PawPrint className="h-4 w-4" aria-hidden />}
                  placeholder="Kedi adı"
                  value={newCatForm.name}
                  onChange={(v) => setNewCatForm((s) => ({ ...s, name: v }))}
                />
                <Field
                  icon={<Search className="h-4 w-4" aria-hidden />}
                  placeholder="Cins (opsiyonel)"
                  value={newCatForm.breed}
                  onChange={(v) => setNewCatForm((s) => ({ ...s, breed: v }))}
                />
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-full bg-peach-400 px-4 py-2 text-xs font-semibold text-white shadow-glow transition hover:-translate-y-0.5 disabled:opacity-60"
                  disabled={
                    !selectedCustomerId ||
                    !newCatForm.name.trim() ||
                    createCustomerCat.isPending
                  }
                  onClick={() => {
                    if (!selectedCustomerId) {
                      setWizardError("Önce müşteri seçmelisin.");
                      return;
                    }
                    createCustomerCat.mutate({
                      name: newCatForm.name.trim(),
                      breed: newCatForm.breed.trim() || undefined,
                    });
                  }}
                >
                  {createCustomerCat.isPending
                    ? "Kaydediliyor..."
                    : "Kedi Ekle"}
                </button>
              </div>
            </div>
          )}
        </StepCard>
      )}

      {step === "dates" && (
        <StepCard title="Tarih & Oda Uygunluğu">
          <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
            <div className="space-y-3 rounded-2xl border bg-[var(--admin-surface-alt)] p-4 admin-border">
              <p className="text-sm font-semibold">Tarih seç</p>
              <Field
                icon={<CalendarRange className="h-4 w-4" aria-hidden />}
                placeholder="Giriş tarihi"
                value={checkIn}
                onChange={(v) => setCheckIn(v)}
                min={todayIso}
                type="date"
              />
              <Field
                icon={<CalendarRange className="h-4 w-4" aria-hidden />}
                placeholder="Çıkış tarihi"
                value={checkOut}
                onChange={(v) => setCheckOut(v)}
                min={checkIn || todayIso}
                type="date"
              />
              <div className="rounded-2xl bg-[var(--admin-surface)] px-3 py-2 text-sm font-semibold admin-border">
                {nightCount ? `${nightCount} gece` : "Gece sayısı otomatik hesaplanır."}
              </div>
            </div>
            <div className="space-y-3">
              <p className="text-sm font-semibold">Oda uygunluk</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {roomList.map((room) => {
                  const availabilityKnown = room.available !== undefined;
                  const isUnavailable =
                    availabilityKnown && room.available === false;
                  const isCurrentRoom = initialReservation?.room?.id === room.id;
                  const badgeLabel = !availabilityKnown
                    ? "Uygunluk bilinmiyor"
                    : room.available === false
                    ? isCurrentRoom
                      ? "Mevcut oda"
                      : "Dolu"
                    : "Uygun";
                  return (
                    <button
                      key={room.id}
                      type="button"
                      onClick={() => {
                        if (isUnavailable && !isCurrentRoom) return;
                        setSelectedRoom(room.id);
                      }}
                      className={clsx(
                        "flex flex-col items-start gap-1 rounded-2xl border px-3 py-3 text-left transition admin-border",
                        selectedRoom === room.id
                          ? "border-peach-300 bg-[var(--admin-highlight-muted)]"
                          : isUnavailable && !isCurrentRoom
                          ? "opacity-60 cursor-not-allowed"
                          : "hover:border-peach-200"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <Home className="h-4 w-4 text-peach-400" aria-hidden />
                        <p className="text-sm font-semibold">{room.name}</p>
                      </div>
                      <p className="text-xs text-[var(--admin-muted)]">
                        {room.type ?? "Tip"}
                      </p>
                      <span
                        className={clsx(
                          "mt-1 inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.25em]",
                          !availabilityKnown
                            ? "bg-slate-100 text-slate-600 dark:bg-slate-500/20 dark:text-slate-200"
                            : room.available === false && !isCurrentRoom
                            ? "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-200"
                            : "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200"
                        )}
                      >
                        {loadingAvailability ? "Kontrol ediliyor..." : badgeLabel}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </StepCard>
      )}

      {step === "pricing" && (
        <StepCard title="Fiyat & Onay">
          <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
            <div className="space-y-3 rounded-2xl border bg-[var(--admin-surface-alt)] p-4 admin-border">
              <p className="text-sm font-semibold">Ek hizmetler</p>
              <div className="flex items-center gap-2 rounded-2xl border bg-[var(--admin-surface)] px-3 py-2 text-sm admin-border">
                <PawPrint className="h-4 w-4 text-peach-400" aria-hidden />
                <span className="flex-1">Ekstra oyun saati</span>
                <span className="text-[var(--admin-muted)]">150 TL</span>
              </div>
              <div className="flex items-center gap-2 rounded-2xl border bg-[var(--admin-surface)] px-3 py-2 text-sm admin-border">
                <PawPrint className="h-4 w-4 text-peach-400" aria-hidden />
                <span className="flex-1">Özel oda genişletme</span>
                <span className="text-[var(--admin-muted)]">100 TL</span>
              </div>
            </div>
            <div className="space-y-3 rounded-2xl border bg-[var(--admin-surface-alt)] p-4 admin-border">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Toplam</p>
                <p className="text-xl font-semibold text-[var(--admin-text-strong)]">
                  2.750 TL
                </p>
              </div>
              <Line label="Oda ücreti" value="2.500 TL" />
              <Line label="Ek hizmet" value="250 TL" />
              <Line label="Ön ödeme" value="-500 TL" />
              <textarea
                placeholder="Müşteri notu..."
                className="mt-2 w-full rounded-2xl border bg-[var(--admin-surface)] p-3 text-sm text-[var(--admin-text-strong)] placeholder:text-[var(--admin-muted)] focus:outline-none focus:ring-2 focus:ring-peach-300 admin-border"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full bg-peach-400 px-4 py-2 text-sm font-semibold text-white shadow-glow transition hover:-translate-y-0.5"
                disabled={!onSubmitAction || submitting}
                onClick={async () => {
                  if (!onSubmitAction) return;
                  const reason =
                    validationMessageForStep("dates") ||
                    validationMessageForStep("cats") ||
                    validationMessageForStep("customer");
                  if (reason) {
                    setWizardError(reason);
                    return;
                  }
                  await onSubmitAction({
                    roomId: selectedRoom,
                    catIds: selectedCats,
                    checkIn,
                    checkOut,
                    specialRequests: notes,
                    customerId: selectedCustomerId,
                  });
                }}
              >
                {submitting ? "Kaydediliyor..." : "Rezervasyonu Oluştur"}
              </button>
            </div>
          </div>
        </StepCard>
      )}

      <div className="flex items-center justify-between">
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold text-[var(--admin-text-strong)] transition hover:-translate-y-0.5 hover:border-peach-300 hover:text-peach-500 admin-border"
          disabled={step === "customer" || (isEdit && step === "cats")}
          onClick={goPrev}
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
          Geri
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-full bg-peach-400 px-4 py-2 text-sm font-semibold text-white shadow-glow transition hover:-translate-y-0.5 disabled:opacity-60"
          onClick={goNext}
          disabled={step === "pricing" || nextDisabled}
        >
          İleri
          <ChevronRight className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}

function StepCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--admin-border)] bg-[var(--admin-surface-alt)] p-4">
      <p className="text-sm font-semibold text-[var(--admin-text-strong)]">
        {title}
      </p>
      <div className="mt-3 space-y-3">{children}</div>
    </div>
  );
}

function Field({
  icon,
  placeholder,
  value,
  onChange,
  min,
  type = "text",
}: {
  icon: React.ReactNode;
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

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm font-semibold text-[var(--admin-text-strong)]">
      <span className="text-[var(--admin-muted)]">{label}</span>
      <span>{value}</span>
    </div>
  );
}

function Stepper({ current }: { current: StepKey }) {
  return (
    <div className="wizard-steps">
      {stepOrder.map((key, idx) => {
        const state =
          idx < stepOrder.indexOf(current)
            ? "done"
            : idx === stepOrder.indexOf(current)
            ? "active"
            : "pending";
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

