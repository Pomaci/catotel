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
import type {
  AddonService,
  Cat,
  Reservation,
  ReservationRoomAssignment,
  RoomType,
} from "@/types/hotel";
import { ReservationStatus } from "@/types/enums";
import { AdminApi, type PricingSettingsResponse } from "@/lib/api/admin";
import { HotelApi } from "@/lib/api/hotel";
import type { CustomerSearch } from "@/types/user";

type StepKey = "customer" | "cats" | "dates" | "pricing";
const stepOrder: StepKey[] = ["customer", "cats", "dates", "pricing"];

type WizardValues = {
  roomTypeId: string | null;
  catIds: string[];
  checkIn: string;
  checkOut: string;
  specialRequests?: string;
  customerId?: string | null;
  allowRoomSharing?: boolean;
  addons?: ReservationAddonInput[];
};

type ReservationAddonInput = {
  serviceId: string;
  quantity: number;
};

type NormalizedPricingSettings = {
  multiCatDiscountEnabled: boolean;
  multiCatDiscounts: Array<{ catCount: number; discountPercent: number }>;
  sharedRoomDiscountEnabled: boolean;
  sharedRoomDiscounts: Array<{ remainingCapacity: number; discountPercent: number }>;
  longStayDiscountEnabled: boolean;
  longStayDiscounts: Array<{ minNights: number; discountPercent: number }>;
};

type PricingDiscountLine = {
  key: "multiCat" | "sharedRoom" | "longStay";
  label: string;
  percent: number;
  amount: number;
  description: string;
};

type PricingAddonLine = {
  serviceId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
};

type PricingBreakdown = {
  nightlyRate: number;
  slotCount: number;
  nights: number;
  baseTotal: number;
  discounts: PricingDiscountLine[];
  addons: PricingAddonLine[];
  addonsTotal: number;
  total: number;
  remainingCapacity: number;
  allowRoomSharing: boolean;
};

const PRICING_SETTINGS_STORAGE_KEY = "catotel-pricing-settings";

const defaultPricingSettings: NormalizedPricingSettings = {
  multiCatDiscountEnabled: true,
  multiCatDiscounts: [
    { catCount: 2, discountPercent: 5 },
    { catCount: 3, discountPercent: 10 },
  ],
  sharedRoomDiscountEnabled: false,
  sharedRoomDiscounts: [
    { remainingCapacity: 1, discountPercent: 5 },
    { remainingCapacity: 2, discountPercent: 8 },
  ],
  longStayDiscountEnabled: true,
  longStayDiscounts: [
    { minNights: 7, discountPercent: 5 },
    { minNights: 10, discountPercent: 10 },
  ],
};

export function ReservationWizard({
  mode = "create",
  rooms = [],
  roomTypes = [],
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
  rooms?: RoomType[];
  roomTypes?: RoomType[];
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
  const [selectedRoomTypeId, setSelectedRoomTypeId] = useState<string | null>(
    initialReservation?.roomType.id ?? null
  );
  const [allowRoomSharing, setAllowRoomSharing] = useState<boolean>(
    initialReservation?.allowRoomSharing ?? true
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
  const selectedCatCount = selectedCats.length;
  const [selectedAddons, setSelectedAddons] = useState<ReservationAddonInput[]>(
    initialReservation?.services.map((service) => ({
      serviceId: service.service.id,
      quantity: Math.max(1, service.quantity),
    })) ?? []
  );

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
    queryKey: ["rooms-availability", checkIn, checkOut, selectedCatCount],
    enabled: Boolean(checkIn && checkOut),
    queryFn: () => HotelApi.listRooms(false, checkIn, checkOut, selectedCatCount || undefined),
  });

  const { data: addonServices, isFetching: loadingAddonServices } = useQuery({
    queryKey: ["addon-services"],
    queryFn: () => HotelApi.listAddonServices(),
    staleTime: 60_000,
  });

  const pricingSettingsQuery = useQuery({
    queryKey: ["pricing-settings"],
    queryFn: async () => {
      try {
        const remote = await AdminApi.getPricingSettings();
        if (remote) {
          writePricingSettingsCache(remote);
        }
        return remote;
      } catch (error) {
        if (isPricingSettingsNotFound(error)) {
          return readPricingSettingsCache();
        }
        throw error instanceof Error ? error : new Error("Fiyat ayarları alınamadı");
      }
    },
    staleTime: 60_000,
  });

  useEffect(() => {
    if (initialReservation) {
      setSelectedRoomTypeId(initialReservation.roomType.id);
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
      setAllowRoomSharing(
        initialReservation.allowRoomSharing === undefined
          ? true
          : initialReservation.allowRoomSharing
      );
      if (isEdit && initialStep) {
        setStep(initialStep);
      } else if (isEdit) {
        setStep("cats");
      }
      if (initialReservation.services?.length) {
        setSelectedAddons(
          initialReservation.services.map((service) => ({
            serviceId: service.service.id,
            quantity: Math.max(1, service.quantity),
          }))
        );
      } else {
        setSelectedAddons([]);
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
      setCustomerSuccess("Yeni müşteri oluşturuldu");
    } catch (err: any) {
      setCustomerError(err?.message ?? "Müşteri oluşturulamadı");
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

  const hasCustomerSelected = Boolean(selectedCustomerId);
  const hasSelectedCats = selectedCats.length > 0;
  const hasStartedStay =
    initialReservation?.status === ReservationStatus.CHECKED_IN ||
    initialReservation?.status === ReservationStatus.CHECKED_OUT;
  const enforceFutureCheckIn = !isEdit || !hasStartedStay;
  const isCheckInBeforeToday = enforceFutureCheckIn && checkIn && checkIn < todayIso;
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
  const roomList = useMemo<RoomType[]>(
    () => availabilityRooms ?? roomTypes ?? rooms ?? [],
    [availabilityRooms, roomTypes, rooms],
  );
  const selectedRoomType = useMemo<RoomType | null>(() => {
    if (selectedRoomTypeId) {
      return roomList.find((room) => room.id === selectedRoomTypeId) ?? initialReservation?.roomType ?? null;
    }
    return initialReservation?.roomType ?? null;
  }, [roomList, selectedRoomTypeId, initialReservation]);
  const normalizedPricingSettings = useMemo(
    () => normalizePricingSettings(pricingSettingsQuery.data),
    [pricingSettingsQuery.data],
  );
  const combinedAddonServices = useMemo<AddonService[]>(() => {
    const base = addonServices ?? [];
    if (!initialReservation?.services?.length) {
      return base;
    }
    const map = new Map(base.map((svc) => [svc.id, svc]));
    initialReservation.services.forEach((svc) => {
      if (!map.has(svc.service.id)) {
        map.set(svc.service.id, svc.service);
      }
    });
    return Array.from(map.values());
  }, [addonServices, initialReservation]);
  const selectedAddonDetails = useMemo(() => {
    if (!selectedAddons.length) return [];
    return selectedAddons
      .map((addon) => {
        const service = combinedAddonServices.find((svc) => svc.id === addon.serviceId);
        if (!service) return null;
        return { service, quantity: addon.quantity };
      })
      .filter(Boolean) as Array<{ service: AddonService; quantity: number }>;
  }, [selectedAddons, combinedAddonServices]);
  const pricingBreakdown = useMemo(
    () =>
      calculatePricingBreakdown({
        room: selectedRoomType,
        nights: nightCount,
        catCount: selectedCatCount,
        allowRoomSharing,
        settings: normalizedPricingSettings,
        addons: selectedAddonDetails,
      }),
    [
      selectedRoomType,
      nightCount,
      selectedCatCount,
      allowRoomSharing,
      normalizedPricingSettings,
      selectedAddonDetails,
    ],
  );
  const pricingSettingsError =
    pricingSettingsQuery.error instanceof Error ? pricingSettingsQuery.error.message : null;
  const handleAddonToggle = (serviceId: string) => {
    setSelectedAddons((prev) => {
      const exists = prev.find((item) => item.serviceId === serviceId);
      if (exists) {
        return prev.filter((item) => item.serviceId !== serviceId);
      }
      return [...prev, { serviceId, quantity: 1 }];
    });
  };
  const handleAddonQuantityChange = (serviceId: string, quantity: number) => {
    setSelectedAddons((prev) =>
      prev.map((item) =>
        item.serviceId === serviceId
          ? { ...item, quantity: Math.max(1, Math.round(quantity) || 1) }
          : item,
      ),
    );
  };
  const clearSelectedAddons = () => setSelectedAddons([]);

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
      if (!selectedRoomTypeId) return "Lütfen oda tipi seç.";
      const activeRoom = roomList.find((room) => room.id === selectedRoomTypeId);
      if (!activeRoom) return "Seçtiğin oda tipi bulunamadı.";
      if (!roomHasCapacityForSelection(activeRoom, allowRoomSharing, selectedCatCount)) {
        return allowRoomSharing
          ? "Bu dönem için yeterli slot yok."
          : "Bu oda tipi bu dönem için dolu.";
      }
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
              roomTypeId: selectedRoomTypeId,
              catIds: selectedCats,
              checkIn,
              checkOut,
              specialRequests: notes,
              customerId: selectedCustomerId,
              allowRoomSharing,
              addons: selectedAddons.map((addon) => ({
                serviceId: addon.serviceId,
                quantity: Math.max(1, addon.quantity),
              })),
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
                      selectedCustomerId === cust.id
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
              İlerlemek için önce müşteri seç.
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
                <div className="min-h-[12rem] max-h-[26rem] overflow-y-auto pr-1">
                  {availableCats.length === 0 ? (
                    <p className="text-xs text-[var(--admin-muted)]">
                      Henüz kedi eklenmemiş.
                    </p>
                  ) : (
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
                  )}
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
                  {createCustomerCat.isPending ? "Kaydediliyor..." : "Kedi Ekle"}
                </button>
              </div>
            </div>
          )}
        </StepCard>
      )}

      {step === "dates" && (
        <StepCard title="Tarih & Oda Tipi Uygunluğu">
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
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Oda tipi uygunluk</p>
                <p className="text-xs font-semibold text-[var(--admin-muted)]">
                  Seçtiğin kedilerin kapasiteye sığdığından emin ol.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {roomList.map((room) => {
                  const totalUnits = room.totalUnits ?? 0;
                  const allowedUnits = totalUnits + (room.overbookingLimit ?? 0);
                  const capacity = Math.max(1, room.capacity);
                  const rawAvailableSlots =
                    typeof room.availableSlots === "number" ? room.availableSlots : null;
                  const unitsToSlots =
                    room.availableUnits !== null && room.availableUnits !== undefined
                      ? Math.max(0, room.availableUnits) * capacity
                      : null;
                  const availableSlots = rawAvailableSlots ?? unitsToSlots;
                  const availableUnits =
                    room.availableUnits ??
                    (availableSlots !== null ? Math.floor(availableSlots / capacity) : null);
                  const isCurrentRoom =
                    selectedRoomTypeId === room.id ||
                    initialReservation?.roomType?.id === room.id;
                  const capacityOk = room.capacityOk ?? room.capacity >= selectedCatCount;
                  const capacityWarning = selectedCatCount > 0 && !capacityOk;
                  const requestedSlots = Math.max(selectedCatCount || 0, 1);
                  const sharedBlocked =
                    allowRoomSharing &&
                    selectedCatCount > 0 &&
                    availableSlots !== null &&
                    availableSlots < requestedSlots;
                  const exclusiveBlocked =
                    !allowRoomSharing &&
                    availableUnits !== null &&
                    availableUnits <= 0;
                  const availabilityKnown = allowRoomSharing
                    ? availableSlots !== null
                    : availableUnits !== null;
                  const isUnavailable =
                    capacityWarning ||
                    (allowRoomSharing ? sharedBlocked : exclusiveBlocked);
                  const badgeLabel = capacityWarning
                    ? `Kapasite yetersiz (${room.capacity} kedi)`
                    : !availabilityKnown
                    ? isCurrentRoom
                      ? "Mevcut seçim"
                      : "Uygunluk bilinmiyor"
                    : allowRoomSharing
                    ? availableSlots && availableSlots > 0
                      ? `Kalan slot: ${availableSlots}`
                      : "Slot yok"
                    : availableUnits && availableUnits > 0
                    ? `${availableUnits}/${allowedUnits} oda`
                    : "Dolu";
                  const badgeTone = capacityWarning
                    ? "warn"
                    : !availabilityKnown
                    ? "muted"
                    : isUnavailable
                    ? "danger"
                    : "success";
                  return (
                    <button
                      key={room.id}
                      type="button"
                      onClick={() => {
                        if ((isUnavailable || capacityWarning) && !isCurrentRoom) return;
                        setSelectedRoomTypeId(room.id);
                      }}
                      className={clsx(
                        "flex flex-col items-start gap-2 rounded-2xl border px-3 py-3 text-left transition admin-border",
                        selectedRoomTypeId === room.id
                          ? "border-peach-300 bg-[var(--admin-highlight-muted)]"
                          : (isUnavailable || capacityWarning) && !isCurrentRoom
                          ? "opacity-60 cursor-not-allowed"
                          : "hover:border-peach-200"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <Home className="h-4 w-4 text-peach-400" aria-hidden />
                        <p className="text-sm font-semibold">{room.name}</p>
                      </div>
                      <p className="text-xs text-[var(--admin-muted)]">
                        Kapasite: {room.capacity} kedi | Aktif oda: {totalUnits}
                      </p>
                      <span
                        className={clsx(
                          "mt-1 inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.25em]",
                          badgeTone === "danger" &&
                            "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-200",
                          badgeTone === "warn" &&
                            "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200",
                          badgeTone === "muted" &&
                            "bg-[var(--admin-surface)] text-[var(--admin-muted)] dark:bg-white/5",
                          badgeTone === "success" &&
                            "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200"
                        )}
                      >
                        {loadingAvailability ? "Kontrol ediliyor..." : badgeLabel}
                      </span>
                    </button>
                  );
                })}
              </div>
              {selectedRoomTypeId && (
                <div className="rounded-2xl border bg-[var(--admin-surface-alt)] p-4 admin-border">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-[var(--admin-text-strong)]">
                        Odayı paylaşma tercihi
                      </p>
                      <p className="text-xs text-[var(--admin-muted)]">
                        Kapasite {roomList.find((r) => r.id === selectedRoomTypeId)?.capacity ?? "-"} kedi. Bu rezervasyonda diğer müşterilerle paylaşmaya izin verip vermediğini seç.
                      </p>
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold admin-border">
                      <span className="text-[var(--admin-text-strong)]">
                        {allowRoomSharing ? "Paylaşmaya açık" : "Özel kullanım"}
                      </span>
                      <label className="relative inline-flex cursor-pointer items-center">
                        <input
                          type="checkbox"
                          className="peer sr-only"
                          checked={!allowRoomSharing}
                          onChange={() => setAllowRoomSharing((v) => !v)}
                        />
                        <div className="h-6 w-11 rounded-full bg-[var(--admin-border)] peer-checked:bg-peach-400 transition">
                          <div className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition peer-checked:translate-x-5 shadow" />
                        </div>
                      </label>
                    </div>
                  </div>
                  <p className="mt-2 text-xs font-semibold text-[var(--admin-muted)]">
                    Özel kullanım seçersen, oda kapasitesinin tamamı bu rezervasyon için bloklanır ve ücret tüm kapasite üzerinden hesaplanır. Paylaşmaya açık seçersen sadece kendi kedilerinin slotları kadar ücretlendirilir ve diğer müşteriler kalan slotları kullanabilir.
                  </p>
                </div>
              )}
            </div>
          </div>
          {initialReservation && (
            <RoomAssignmentSummary assignments={initialReservation.roomAssignments} />
          )}
        </StepCard>
      )}

      {step === "pricing" && (
        <StepCard title="Fiyat & Onay">
          <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
            <div className="space-y-4">
              <div className="space-y-3 rounded-2xl border bg-[var(--admin-surface-alt)] p-4 admin-border">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">Rezervasyon özeti</p>
                  <span className="admin-chip">
                    {allowRoomSharing ? "Paylaşımlı kullanım" : "Özel kullanım"}
                  </span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <SummaryStat
                    label="Oda"
                    value={selectedRoomType?.name ?? "Oda seçilmedi"}
                    description={
                      selectedRoomType
                        ? `${selectedRoomType.capacity} kedi | Gece: ${formatCurrency(
                            parseAmount(selectedRoomType.nightlyRate),
                          )}`
                        : "Tarih & oda seçim adımını tamamla"
                    }
                  />
                  <SummaryStat
                    label="Kedi sayısı"
                    value={
                      selectedCatCount > 0
                        ? `${selectedCatCount} kedi`
                        : "Henüz seçim yok"
                    }
                    description={
                      allowRoomSharing && selectedRoomType
                        ? `Kalan slot: ${Math.max(
                            selectedRoomType.capacity - selectedCatCount,
                            0,
                          )}`
                        : undefined
                    }
                  />
                  <SummaryStat
                    label="Gece sayısı"
                    value={nightCount ? `${nightCount} gece` : "Belirlenmedi"}
                    description={
                      checkIn && checkOut
                        ? `${checkIn} → ${checkOut}`
                        : "Giriş & çıkış tarihleri gerekli"
                    }
                  />
                  <SummaryStat
                    label="Fiyatlama modu"
                    value={allowRoomSharing ? "Slot bazlı" : "Tam kapasite"}
                    description={
                      allowRoomSharing
                        ? "Sadece seçili slotlar ücretlendirilir"
                        : "Odanın tamamı bu rezervasyona ayrılır"
                    }
                  />
                </div>
                <div className="rounded-2xl bg-[var(--admin-surface)] px-3 py-2 text-xs font-semibold text-[var(--admin-muted)] admin-border">
                  {allowRoomSharing
                    ? "Kalan kapasitelerde diğer müşterilerle paylaşım yapılabilir."
                    : "Özel kullanımda oda tamamen bloklanır ve tüm kapasite ücretlendirilir."}
                </div>
              </div>
              <div className="space-y-3 rounded-2xl border bg-[var(--admin-surface-alt)] p-4 admin-border">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">Ek hizmetler</p>
                  {selectedAddons.length > 0 && (
                    <button
                      type="button"
                      className="text-xs font-semibold text-[var(--admin-muted)] transition hover:text-peach-500"
                      onClick={clearSelectedAddons}
                    >
                      Temizle
                    </button>
                  )}
                </div>
                {loadingAddonServices ? (
                  <p className="text-xs text-[var(--admin-muted)]">Hizmetler yükleniyor...</p>
                ) : combinedAddonServices.length ? (
                  <div className="space-y-2">
                    {combinedAddonServices.map((service) => {
                      const selected = selectedAddons.find((item) => item.serviceId === service.id);
                      return (
                        <div
                          key={service.id}
                          className={clsx(
                            "flex flex-col gap-3 rounded-2xl border bg-[var(--admin-surface)] p-3 text-sm font-semibold text-[var(--admin-text-strong)] admin-border sm:flex-row sm:items-center sm:justify-between",
                            selected && "border-peach-300 shadow-sm",
                          )}
                        >
                          <div>
                            <p>{service.name}</p>
                            <p className="text-xs text-[var(--admin-muted)]">
                              {service.description?.trim() || "Açıklama yok"}
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-[var(--admin-surface-alt)] px-3 py-1 text-xs font-semibold">
                              {formatCurrency(parseAmount(service.price))}
                            </span>
                            {selected && (
                              <div className="inline-flex items-center gap-2 rounded-full border bg-[var(--admin-surface-alt)] px-2 py-1 text-xs font-semibold admin-border">
                                <span>Adet</span>
                                <input
                                  type="number"
                                  min={1}
                                  value={selected.quantity}
                                  onChange={(event) =>
                                    handleAddonQuantityChange(service.id, Number(event.target.value))
                                  }
                                  className="w-16 bg-transparent text-sm font-semibold text-[var(--admin-text-strong)] focus:outline-none"
                                />
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={() => handleAddonToggle(service.id)}
                              className={clsx(
                                "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold transition",
                                selected
                                  ? "border-red-200 text-red-500 hover:-translate-y-0.5 hover:bg-red-50/70"
                                  : "text-[var(--admin-text-strong)] hover:-translate-y-0.5 hover:border-peach-200",
                              )}
                            >
                              <PawPrint className="h-4 w-4" aria-hidden />
                              {selected ? "Çıkar" : "Ekle"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-[var(--admin-muted)]">
                    Henüz tanımlı ek hizmet yok. Ayarlar &gt; Fiyatlandırma bölümünden ekleyebilirsin.
                  </p>
                )}
                {selectedAddonDetails.length ? (
                  <div className="rounded-2xl border bg-[var(--admin-surface)] p-3 text-xs font-semibold text-[var(--admin-text-strong)] admin-border">
                    <p className="mb-2 text-[var(--admin-muted)]">Seçilen hizmetler</p>
                    <div className="space-y-1">
                      {selectedAddonDetails.map((entry) => (
                        <div key={entry.service.id} className="flex items-center justify-between">
                          <span>
                            {entry.service.name} × {entry.quantity}
                          </span>
                          <span>{formatCurrency(parseAmount(entry.service.price) * entry.quantity)}</span>
                        </div>
                      ))}
                    </div>
                    <p className="mt-2 flex items-center justify-between text-sm">
                      <span>Toplam</span>
                      <span>{formatCurrency(pricingBreakdown?.addonsTotal ?? 0)}</span>
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-[var(--admin-muted)]">
                    Ek hizmet seçerek rezervasyonu özelleştirebilirsin.
                  </p>
                )}
              </div>
              <div className="space-y-3 rounded-2xl border bg-[var(--admin-surface-alt)] p-4 admin-border">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">İndirimler</p>
                  {pricingSettingsQuery.isFetching && (
                    <span className="text-xs text-[var(--admin-muted)]">
                      Yükleniyor...
                    </span>
                  )}
                </div>
                {pricingSettingsError && (
                  <p className="text-xs font-semibold text-red-500">
                    İndirim ayarları alınamadı. Varsayılan değerler kullanılıyor.
                  </p>
                )}
                {pricingBreakdown?.discounts.length ? (
                  <div className="space-y-2">
                    {pricingBreakdown.discounts.map((discount) => (
                      <div
                        key={`${discount.key}-${discount.percent}`}
                        className="flex items-center justify-between rounded-2xl border bg-[var(--admin-surface)] px-3 py-2 text-sm font-semibold text-emerald-600 admin-border"
                      >
                        <div>
                          <p>{discount.label}</p>
                          <p className="text-xs text-emerald-600">
                            {discount.description}
                          </p>
                        </div>
                        <span>-{formatCurrency(discount.amount)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[var(--admin-muted)]">
                    Uygulanabilir indirim bulunamadı. Ayarlar &gt; Fiyatlandırma
                    sekmesinden kural ekleyebilirsin.
                  </p>
                )}
              </div>
            </div>
            <div className="space-y-3 rounded-2xl border bg-[var(--admin-surface-alt)] p-4 admin-border">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Fiyat özeti</p>
                <p className="text-xl font-semibold text-[var(--admin-text-strong)]">
                  {pricingBreakdown ? formatCurrency(pricingBreakdown.total) : "—"}
                </p>
              </div>
              {pricingBreakdown ? (
                <>
                  <Line
                    label={`Oda ücreti (${pricingBreakdown.nights} gece x ${pricingBreakdown.slotCount} slot)`}
                    value={formatCurrency(pricingBreakdown.baseTotal)}
                  />
                  {pricingBreakdown.addons.length > 0 && (
                    <Line
                      label="Ek hizmetler"
                      value={formatCurrency(pricingBreakdown.addonsTotal)}
                    />
                  )}
                  {pricingBreakdown.discounts.map((discount) => (
                    <Line
                      key={`line-${discount.key}`}
                      label={discount.label}
                      value={`-${formatCurrency(discount.amount)}`}
                      variant="discount"
                    />
                  ))}
                  <Line
                    label="Toplam"
                    value={formatCurrency(pricingBreakdown.total)}
                    variant="total"
                  />
                </>
              ) : (
                <div className="rounded-2xl bg-[var(--admin-surface)] px-3 py-2 text-xs text-[var(--admin-muted)]">
                  Fiyat oluşturmak için müşteri, kedi, tarih ve oda seçimini
                  tamamla.
                </div>
              )}
              <textarea
                placeholder="Müşteri notu..."
                className="w-full rounded-2xl border bg-[var(--admin-surface)] p-3 text-sm text-[var(--admin-text-strong)] placeholder:text-[var(--admin-muted)] focus:outline-none focus:ring-2 focus:ring-peach-300 admin-border"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
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
                  roomTypeId: selectedRoomTypeId,
                  catIds: selectedCats,
                  checkIn,
                  checkOut,
                  specialRequests: notes,
                  customerId: selectedCustomerId,
                  allowRoomSharing,
                  addons: selectedAddons.map((addon) => ({
                    serviceId: addon.serviceId,
                    quantity: Math.max(1, addon.quantity),
                  })),
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

function SummaryStat({
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
      {description && (
        <p className="text-xs text-[var(--admin-muted)]">{description}</p>
      )}
    </div>
  );
}

function RoomAssignmentSummary({
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
                  {compactDate(assignment.checkIn)} ƒ?" {compactDate(assignment.checkOut)}
                </p>
              </div>
              <div className="text-xs font-semibold text-[var(--admin-muted)] sm:text-right">
                <span
                  className={clsx(
                    "inline-flex items-center gap-2 rounded-full px-2 py-0.5 text-[11px]",
                    assignment.lockedAt
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-blue-100 text-blue-700",
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

function Line({
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

function readPricingSettingsCache(): PricingSettingsResponse | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(PRICING_SETTINGS_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PricingSettingsResponse) : null;
  } catch {
    return null;
  }
}

function writePricingSettingsCache(payload: PricingSettingsResponse) {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(PRICING_SETTINGS_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // ignore storage quota errors
  }
}

function isPricingSettingsNotFound(error: unknown) {
  return error instanceof Error && /404/.test(error.message);
}

function normalizePricingSettings(payload?: PricingSettingsResponse | null): NormalizedPricingSettings {
  if (!payload) {
    return defaultPricingSettings;
  }
  const multiCatSource =
    payload.multiCatDiscounts && payload.multiCatDiscounts.length > 0
      ? payload.multiCatDiscounts
      : defaultPricingSettings.multiCatDiscounts;
  let sharedRoomSource =
    payload.sharedRoomDiscounts && payload.sharedRoomDiscounts.length > 0
      ? payload.sharedRoomDiscounts
      : undefined;
  if ((!sharedRoomSource || sharedRoomSource.length === 0) && typeof payload.sharedRoomDiscountPercent === "number") {
    sharedRoomSource = [{ remainingCapacity: 1, discountPercent: payload.sharedRoomDiscountPercent }];
  }
  if (!sharedRoomSource || sharedRoomSource.length === 0) {
    sharedRoomSource = defaultPricingSettings.sharedRoomDiscounts;
  }
  let longStaySource =
    payload.longStayDiscounts && payload.longStayDiscounts.length > 0
      ? payload.longStayDiscounts
      : undefined;
  if ((!longStaySource || longStaySource.length === 0) && payload.longStayDiscount) {
    longStaySource = [
      {
        minNights: payload.longStayDiscount.minNights,
        discountPercent: payload.longStayDiscount.discountPercent,
      },
    ];
  }
  if (!longStaySource || longStaySource.length === 0) {
    longStaySource = defaultPricingSettings.longStayDiscounts;
  }
  return {
    multiCatDiscountEnabled:
      payload.multiCatDiscountEnabled ?? defaultPricingSettings.multiCatDiscountEnabled,
    multiCatDiscounts: multiCatSource
      .map((tier) => ({
        catCount: tier.catCount,
        discountPercent: tier.discountPercent,
      }))
      .sort((a, b) => a.catCount - b.catCount),
    sharedRoomDiscountEnabled:
      payload.sharedRoomDiscountEnabled ?? defaultPricingSettings.sharedRoomDiscountEnabled,
    sharedRoomDiscounts: sharedRoomSource
      .map((tier) => ({
        remainingCapacity: tier.remainingCapacity,
        discountPercent: tier.discountPercent,
      }))
      .sort((a, b) => a.remainingCapacity - b.remainingCapacity),
    longStayDiscountEnabled:
      payload.longStayDiscountEnabled ??
      payload.longStayDiscount?.enabled ??
      defaultPricingSettings.longStayDiscountEnabled,
    longStayDiscounts: longStaySource
      .map((tier) => ({
        minNights: tier.minNights,
        discountPercent: tier.discountPercent,
      }))
      .sort((a, b) => a.minNights - b.minNights),
  };
}

function calculatePricingBreakdown({
  room,
  nights,
  catCount,
  allowRoomSharing,
  settings,
  addons,
}: {
  room: RoomType | null;
  nights: number | null;
  catCount: number;
  allowRoomSharing: boolean;
  settings: NormalizedPricingSettings;
  addons?: Array<{ service: AddonService; quantity: number }>;
}): PricingBreakdown | null {
  if (!room || !nights || nights <= 0 || catCount <= 0) {
    return null;
  }
  const nightlyRate = parseAmount(room.nightlyRate);
  if (nightlyRate <= 0) {
    return null;
  }
  const capacity = Math.max(room.capacity ?? catCount, 1);
  const slotCount = allowRoomSharing ? Math.min(Math.max(catCount, 1), capacity) : capacity;
  const baseTotal = nightlyRate * slotCount * nights;
  if (baseTotal <= 0) {
    return null;
  }
  const discounts: PricingDiscountLine[] = [];
  const addonLines: PricingAddonLine[] = [];
  const remainingCapacity = allowRoomSharing ? Math.max(capacity - catCount, 0) : 0;
  if (addons?.length) {
    addons.forEach((entry) => {
      const unitPrice = parseAmount(entry.service.price);
      if (unitPrice <= 0 || entry.quantity <= 0) return;
      const total = unitPrice * Math.max(1, entry.quantity);
      addonLines.push({
        serviceId: entry.service.id,
        name: entry.service.name,
        quantity: Math.max(1, entry.quantity),
        unitPrice,
        total,
      });
    });
  }

  if (settings.multiCatDiscountEnabled && settings.multiCatDiscounts.length > 0) {
    let applied: { catCount: number; discountPercent: number } | null = null;
    settings.multiCatDiscounts.forEach((tier) => {
      if (catCount >= tier.catCount) {
        applied = tier;
      }
    });
    if (applied && applied.discountPercent > 0) {
      discounts.push({
        key: "multiCat",
        label: `Çok kedili indirim (${applied.discountPercent}%)`,
        percent: applied.discountPercent,
        amount: (baseTotal * applied.discountPercent) / 100,
        description: `${applied.catCount}+ kedi`,
      });
    }
  }

  if (
    allowRoomSharing &&
    settings.sharedRoomDiscountEnabled &&
    settings.sharedRoomDiscounts.length > 0
  ) {
    let applied: { remainingCapacity: number; discountPercent: number } | null = null;
    settings.sharedRoomDiscounts.forEach((tier) => {
      if (remainingCapacity >= tier.remainingCapacity) {
        applied = tier;
      }
    });
    if (applied && applied.discountPercent > 0) {
      discounts.push({
        key: "sharedRoom",
        label: `Paylaşım indirimi (${applied.discountPercent}%)`,
        percent: applied.discountPercent,
        amount: (baseTotal * applied.discountPercent) / 100,
        description: `${applied.remainingCapacity}+ boş slot`,
      });
    }
  }

  if (settings.longStayDiscountEnabled && settings.longStayDiscounts.length > 0) {
    let applied: { minNights: number; discountPercent: number } | null = null;
    settings.longStayDiscounts.forEach((tier) => {
      if (nights >= tier.minNights) {
        applied = tier;
      }
    });
    if (applied && applied.discountPercent > 0) {
      discounts.push({
        key: "longStay",
        label: `Uzun konaklama (${applied.discountPercent}%)`,
        percent: applied.discountPercent,
        amount: (baseTotal * applied.discountPercent) / 100,
        description: `${applied.minNights}+ gece`,
      });
    }
  }

  const totalDiscount = discounts.reduce((sum, discount) => sum + discount.amount, 0);
  const addonsTotal = addonLines.reduce((sum, addon) => sum + addon.total, 0);

  return {
    nightlyRate,
    slotCount,
    nights,
    baseTotal,
    discounts,
    addons: addonLines,
    addonsTotal,
    total: Math.max(0, baseTotal - totalDiscount),
    remainingCapacity,
    allowRoomSharing,
  };
}

function roomHasCapacityForSelection(
  room: RoomType,
  allowRoomSharing: boolean,
  requestedCats: number,
) {
  const capacityOk = room.capacityOk ?? true;
  if (!capacityOk) return false;

  const capacity = Math.max(room.capacity, 1);
  const availableSlots =
    typeof room.availableSlots === "number"
      ? room.availableSlots
      : room.availableUnits !== undefined && room.availableUnits !== null
        ? room.availableUnits * capacity
        : null;
  const availableUnits =
    room.availableUnits !== undefined ? room.availableUnits : null;
  const requiredSlots = Math.max(requestedCats || 1, 1);

  if (allowRoomSharing) {
    if (availableSlots === null) return false;
    return availableSlots >= requiredSlots;
  }
  if (availableUnits === null) return false;
  return availableUnits > 0;
}

function parseAmount(value: number | string | undefined | null) {
  if (value === undefined || value === null) {
    return 0;
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }
  const normalized = Number(String(value).replace(",", "."));
  return Number.isFinite(normalized) ? normalized : 0;
}

function formatCurrency(value: number) {
  const safeValue = Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(safeValue));
}
