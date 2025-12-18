import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";

import { AdminApi } from "@/lib/api/admin";
import { HotelApi } from "@/lib/api/hotel";
import { hotelNightCount, toHotelDayString } from "@/lib/utils/hotel-day";
import type { AddonService, Cat, Reservation, RoomType } from "@/types/hotel";
import { ReservationStatus } from "@/types/enums";
import type { CustomerSearch } from "@/types/user";

import {
  calculatePricingBreakdown,
  isPricingSettingsNotFound,
  normalizePricingSettings,
  readPricingSettingsCache,
  roomHasCapacityForSelection,
  writePricingSettingsCache,
} from "./utils";
import {
  stepOrder,
  type ReservationAddonInput,
  type ReservationWizardValues,
  type StepKey,
} from "./types";

type UseReservationWizardOptions = {
  mode?: "create" | "edit";
  rooms?: RoomType[];
  roomTypes?: RoomType[];
  cats?: Cat[];
  initialReservation?: Reservation | null;
  customerName?: string | null;
  allowNewCustomer?: boolean;
  customerCreatedCallbackAction?: (nameOrEmail: string) => void;
  initialStep?: StepKey;
};

export function useReservationWizard({
  mode = "create",
  rooms = [],
  roomTypes = [],
  cats = [],
  initialReservation,
  customerName,
  allowNewCustomer = false,
  customerCreatedCallbackAction,
  initialStep,
}: UseReservationWizardOptions) {
  const isEdit = mode === "edit";
  const reservationCustomerId =
    (initialReservation as any)?.customerId ??
    (initialReservation as any)?.customer?.id ??
    initialReservation?.customer?.user.id ??
    null;

  const defaultStep: StepKey = initialStep ?? (isEdit ? "cats" : "customer");
  const [step, setStep] = useState<StepKey>(defaultStep);
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(customerName ?? null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(reservationCustomerId);
  const [selectedCats, setSelectedCats] = useState<string[]>(
    initialReservation?.cats.map((c) => c.cat.id) ?? [],
  );
  const [selectedRoomTypeId, setSelectedRoomTypeId] = useState<string | null>(
    initialReservation?.roomType.id ?? null,
  );
  const [allowRoomSharing, setAllowRoomSharing] = useState<boolean>(
    initialReservation?.allowRoomSharing ?? true,
  );
  const [checkIn, setCheckIn] = useState(initialReservation?.checkIn.slice(0, 10) ?? "");
  const [checkOut, setCheckOut] = useState(initialReservation?.checkOut.slice(0, 10) ?? "");
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
  const todayIso = useMemo(() => toHotelDayString(new Date()), []);
  const selectedCatCount = selectedCats.length;
  const [selectedAddons, setSelectedAddons] = useState<ReservationAddonInput[]>(
    initialReservation?.services.map((service) => ({
      serviceId: service.service.id,
      quantity: Math.max(1, service.quantity),
    })) ?? [],
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
          null,
      );
      setSelectedCustomerId(reservationCustomerId);
      setAllowRoomSharing(
        initialReservation.allowRoomSharing === undefined
          ? true
          : initialReservation.allowRoomSharing,
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
          })),
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
  const nightCount = useMemo(
    () => hotelNightCount(checkIn, checkOut),
    [checkIn, checkOut],
  );
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
    if (currentStep === "customer" && !hasCustomerSelected) return "Lütfen müşteri seç.";
    if (currentStep === "cats") {
      if (!hasCustomerSelected) return "Önce müşteri seçmelisin.";
      if (!hasSelectedCats) return "En az bir kedi seçmelisin.";
    }
    if (currentStep === "dates") {
      if (!hasSelectedCats) return "Önce kedi seçmelisin.";
      if (!checkIn || !checkOut) return "Giriş ve çıkış tarihlerini seçmelisin.";
      if (isCheckInBeforeToday) return "Giriş tarihi bugünden önce olamaz.";
      if (isCheckOutBeforeCheckIn) return "Çıkış tarihi giriş tarihinden sonra olmalı.";
      if (!selectedRoomTypeId) return "Lütfen oda tipi seç.";
      const activeRoom = roomList.find((room) => room.id === selectedRoomTypeId);
      if (!activeRoom) return "Seçtiğin oda tipi bulunamadı.";
      if (!roomHasCapacityForSelection(activeRoom, allowRoomSharing, selectedCatCount)) {
        return allowRoomSharing ? "Bu dönem için yeterli slot yok." : "Bu oda tipi bu dönem için dolu.";
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

  const combinedCats = useMemo<Cat[]>(() => {
    const list: Cat[] = [
      ...(customerCats as Cat[]),
      ...(initialReservation?.cats?.map((c) => c.cat) ?? []),
      ...(cats ?? []),
    ].filter(Boolean) as Cat[];
    return Array.from(new Map(list.map((cat) => [cat.id, cat])).values());
  }, [customerCats, initialReservation, cats]);

  const nextDisabled = validationMessageForStep(step) !== null || step === "pricing";

  const submissionValues = useMemo<ReservationWizardValues>(
    () => ({
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
    }),
    [
      selectedRoomTypeId,
      selectedCats,
      checkIn,
      checkOut,
      notes,
      selectedCustomerId,
      allowRoomSharing,
      selectedAddons,
    ],
  );

  const validateBeforeSubmit = () =>
    validationMessageForStep("dates") ||
    validationMessageForStep("cats") ||
    validationMessageForStep("customer");

  return {
    isEdit,
    allowNewCustomer,
    step,
    setStep,
    goNext,
    goPrev,
    wizardError,
    setWizardError,
    nextDisabled,
    validateBeforeSubmit,
    submissionValues,
    hasCustomerSelected,
    hasSelectedCats,
    selectedCatCount,
    todayIso,
    customer: {
      selectedCustomer,
      selectedCustomerId,
      searchTerm,
      searchResults,
      searching,
      handleSearch,
      newCustomer,
      setNewCustomer,
      handleCreateCustomer,
      creatingCustomer,
      customerError,
      customerSuccess,
      setSelectedCustomer,
      setSelectedCustomerId,
    },
    catsState: {
      selectedCats,
      setSelectedCats,
      newCatForm,
      setNewCatForm,
      createCustomerCat,
      loadingCustomerCats,
      availableCats: combinedCats,
      refetchCustomerCats,
    },
    dates: {
      checkIn,
      setCheckIn,
      checkOut,
      setCheckOut,
      nightCount,
      roomList,
      loadingAvailability,
      selectedRoomTypeId,
      setSelectedRoomTypeId,
      selectedRoomType,
      allowRoomSharing,
      setAllowRoomSharing,
    },
    pricing: {
      combinedAddonServices,
      selectedAddons,
      handleAddonToggle,
      handleAddonQuantityChange,
      clearSelectedAddons,
      selectedAddonDetails,
      loadingAddonServices,
      pricingBreakdown,
      pricingSettingsError,
      pricingSettingsLoading: pricingSettingsQuery.isFetching,
      notes,
      setNotes,
      checkIn,
      checkOut,
      nightCount,
    },
  };
}
