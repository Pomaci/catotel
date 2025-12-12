"use client";

import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import clsx from "clsx";
import {
  AlertCircle,
  CheckCircle2,
  Edit3,
  FileText,
  Loader2,
  Mail,
  MessageSquare,
  PawPrint,
  Percent,
  PlusCircle,
  Shield,
  Trash2,
  UploadCloud,
  Users2,
  X,
} from "lucide-react";
import { AdminApi, type PricingSettingsResponse, type AdminAddonService } from "@/lib/api/admin";
import type { RoomType } from "@/types/hotel";

type SettingsTab = "general" | "pricing" | "notifications" | "roles";

const tabItems: { id: SettingsTab; label: string; description: string; comingSoon?: boolean }[] = [
  { id: "general", label: "Genel", description: "Otel kimliği ve iletişim" },
  { id: "pricing", label: "Fiyatlandırma", description: "Oda tipi fiyatları" },
  { id: "notifications", label: "Bildirimler", description: "Email & SMS şablonları" },
  { id: "roles", label: "Kullanıcı & Roller", description: "Yakında", comingSoon: true },
];

type GeneralFormValues = {
  hotelName: string;
  phone: string;
  email: string;
  address: string;
  contactEmail: string;
};

type TemplateChannel = "email" | "sms";

type Template = {
  id: string;
  name: string;
  subject?: string;
  body: string;
};

type RoomPricingState = Record<string, { value: string; original: string }>;

type MultiCatDiscount = {
  id: string;
  catCount: number;
  discountPercent: number;
};

type SharedRoomDiscount = {
  id: string;
  remainingCapacity: number;
  discountPercent: number;
};

type LongStayDiscountTier = {
  id: string;
  minNights: number;
  discountPercent: number;
};

type PricingRuleState = {
  multiCatEnabled: boolean;
  multiCatDiscounts: MultiCatDiscount[];
  sharedRoomDiscountEnabled: boolean;
  sharedRoomDiscounts: SharedRoomDiscount[];
  longStayDiscount: {
    enabled: boolean;
    tiers: LongStayDiscountTier[];
  };
};

const initialGeneral: GeneralFormValues = {
  hotelName: "Miaow Cat Hotel",
  phone: "+90 555 123 45 67",
  email: "info@miaowhotel.com",
  address: "Güneş Sok. No: 12, Moda / Kadıköy / İstanbul",
  contactEmail: "reservations@miaowhotel.com",
};

const initialEmailTemplates: Template[] = [
  {
    id: "reservation-confirmation",
    name: "Rezervasyon Onayı",
    subject: "Miaow Hotel rezervasyonunuz hazır!",
    body: "Merhaba {musteri_adi}, {giris_tarihi} - {cikis_tarihi} tarihleri arasında {oda_adi} odanız onaylandı.",
  },
  {
    id: "checkin-reminder",
    name: "Check-in Hatırlatma",
    subject: "Yarın görüşüyoruz!",
    body: "Kediniz {kedi_adi} için {giris_tarihi} tarihinde check-in bekliyoruz.",
  },
  {
    id: "checkout-info",
    name: "Check-out Bilgilendirme",
    subject: "Check-out için minik bir hatırlatma",
    body: "{cikis_tarihi} tarihinde çıkış işlemlerinizi 12:00’ye kadar tamamlamanızı rica ederiz.",
  },
  {
    id: "cancellation",
    name: "İptal Bildirimi",
    subject: "Rezervasyon iptal edildi",
    body: "Üzgünüz! Rezervasyonunuz talebiniz doğrultusunda iptal edildi.",
  },
];

const initialSmsTemplates: Template[] = [
  {
    id: "sms-confirmation",
    name: "Rezervasyon Onayı",
    body: "Miaow Hotel: {kedi_adi} için {giris_tarihi} - {cikis_tarihi} rezervasyonunuz onaylandı.",
  },
  {
    id: "sms-reminder",
    name: "Check-in Hatırlatma",
    body: "Hatırlatma: {kedi_adi} yarın {giris_saati}’nda bekleniyor. Görüşmek üzere!",
  },
];

const generateId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2, 10);

const PRICING_SETTINGS_STORAGE_KEY = "catotel-pricing-settings";

const isNotFoundError = (error: unknown) =>
  error instanceof Error && /404/.test(error.message);

const readLocalPricingSettings = (): PricingSettingsResponse | null => {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(PRICING_SETTINGS_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PricingSettingsResponse) : null;
  } catch {
    return null;
  }
};

const writeLocalPricingSettings = (payload: PricingSettingsResponse) => {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(PRICING_SETTINGS_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // ignore quota errors
  }
};

const createDefaultPricingRules = (): PricingRuleState => ({
  multiCatEnabled: true,
  multiCatDiscounts: [
    { id: generateId(), catCount: 2, discountPercent: 5 },
    { id: generateId(), catCount: 3, discountPercent: 10 },
  ],
  sharedRoomDiscountEnabled: false,
  sharedRoomDiscounts: [
    { id: generateId(), remainingCapacity: 1, discountPercent: 5 },
    { id: generateId(), remainingCapacity: 2, discountPercent: 8 },
  ],
  longStayDiscount: {
    enabled: true,
    tiers: [
      { id: generateId(), minNights: 7, discountPercent: 5 },
      { id: generateId(), minNights: 10, discountPercent: 10 },
    ],
  },
});

const mapPricingSettings = (data?: PricingSettingsResponse | null): PricingRuleState => {
  const defaults = createDefaultPricingRules();
  if (!data) return defaults;
  const multiCatSource =
    data.multiCatDiscounts && data.multiCatDiscounts.length > 0
      ? data.multiCatDiscounts
      : defaults.multiCatDiscounts.map(({ catCount, discountPercent }) => ({ catCount, discountPercent }));
  let sharedRoomSource =
    data.sharedRoomDiscounts && data.sharedRoomDiscounts.length > 0
      ? data.sharedRoomDiscounts
      : undefined;
  if ((!sharedRoomSource || sharedRoomSource.length === 0) && typeof data.sharedRoomDiscountPercent === "number") {
    sharedRoomSource = [{ remainingCapacity: 1, discountPercent: data.sharedRoomDiscountPercent }];
  }
  if (!sharedRoomSource || sharedRoomSource.length === 0) {
    sharedRoomSource = defaults.sharedRoomDiscounts.map(({ remainingCapacity, discountPercent }) => ({
      remainingCapacity,
      discountPercent,
    }));
  }
  let longStaySource =
    data.longStayDiscounts && data.longStayDiscounts.length > 0
      ? data.longStayDiscounts
      : undefined;
  if ((!longStaySource || longStaySource.length === 0) && data.longStayDiscount) {
    longStaySource = [
      {
        minNights: data.longStayDiscount.minNights,
        discountPercent: data.longStayDiscount.discountPercent,
      },
    ];
  }
  if (!longStaySource || longStaySource.length === 0) {
    longStaySource = defaults.longStayDiscount.tiers.map(({ minNights, discountPercent }) => ({
      minNights,
      discountPercent,
    }));
  }
  return {
    multiCatEnabled: data.multiCatDiscountEnabled ?? defaults.multiCatEnabled,
    multiCatDiscounts: multiCatSource
      .map((tier) => ({
        id: generateId(),
        catCount: tier.catCount,
        discountPercent: tier.discountPercent,
      }))
      .sort((a, b) => a.catCount - b.catCount),
    sharedRoomDiscountEnabled: data.sharedRoomDiscountEnabled ?? defaults.sharedRoomDiscountEnabled,
    sharedRoomDiscounts: sharedRoomSource
      .map((tier) => ({
        id: generateId(),
        remainingCapacity: tier.remainingCapacity,
        discountPercent: tier.discountPercent,
      }))
      .sort((a, b) => a.remainingCapacity - b.remainingCapacity),
    longStayDiscount: {
      enabled: data.longStayDiscountEnabled ?? data.longStayDiscount?.enabled ?? defaults.longStayDiscount.enabled,
      tiers: longStaySource
        .map((tier) => ({
          id: generateId(),
          minNights: tier.minNights,
          discountPercent: tier.discountPercent,
        }))
        .sort((a, b) => a.minNights - b.minNights),
    },
  };
};

const serializePricingSettings = (state: PricingRuleState): PricingSettingsResponse => ({
  multiCatDiscountEnabled: state.multiCatEnabled,
  multiCatDiscounts: state.multiCatDiscounts
    .map(({ catCount, discountPercent }) => ({
      catCount,
      discountPercent,
    }))
    .sort((a, b) => a.catCount - b.catCount),
  sharedRoomDiscountEnabled: state.sharedRoomDiscountEnabled,
  sharedRoomDiscounts: state.sharedRoomDiscounts
    .map(({ remainingCapacity, discountPercent }) => ({
      remainingCapacity,
      discountPercent,
    }))
    .sort((a, b) => a.remainingCapacity - b.remainingCapacity),
  longStayDiscountEnabled: state.longStayDiscount.enabled,
  longStayDiscounts: state.longStayDiscount.tiers
    .map(({ minNights, discountPercent }) => ({
      minNights,
      discountPercent,
    }))
    .sort((a, b) => a.minNights - b.minNights),
});

const normalizeRoomTypes = (data: RoomType[] | { items?: RoomType[] } | undefined): RoomType[] => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  return data.items ?? [];
};

const inputClasses =
  "w-full rounded-2xl border bg-[var(--admin-surface)] px-4 py-2.5 text-sm font-semibold text-[var(--admin-text-strong)] placeholder:text-[var(--admin-muted)] focus:outline-none focus:ring-2 focus:ring-peach-100 focus:border-peach-300 admin-border";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");
  const [generalValues, setGeneralValues] = useState<GeneralFormValues>(initialGeneral);
  const [logoName, setLogoName] = useState<string | null>(null);
  const [emailTemplates, setEmailTemplates] = useState(initialEmailTemplates);
  const [smsTemplates, setSmsTemplates] = useState(initialSmsTemplates);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveBanner, setSaveBanner] = useState<string | null>(null);
  const [modalPayload, setModalPayload] = useState<{ channel: TemplateChannel; template: Template } | null>(null);
  const queryClient = useQueryClient();
  const roomTypeQuery = useQuery({
    queryKey: ["settings-room-types"],
    queryFn: () => AdminApi.listRoomTypes({ includeInactive: true }),
    staleTime: 60_000,
  });
  const normalizedRoomTypes = useMemo<RoomType[]>(
    () => normalizeRoomTypes(roomTypeQuery.data as RoomType[] | { items?: RoomType[] } | undefined),
    [roomTypeQuery.data],
  );
  const [roomPricing, setRoomPricing] = useState<RoomPricingState>({});
  const [pendingRoomId, setPendingRoomId] = useState<string | null>(null);
  const [recentlySavedRoomId, setRecentlySavedRoomId] = useState<string | null>(null);
  const [roomPricingError, setRoomPricingError] = useState<string | null>(null);
  const updateRoomType = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      AdminApi.updateRoomType(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings-room-types"] });
    },
  });
  const pricingSettingsQuery = useQuery({
    queryKey: ["settings-pricing-settings"],
    queryFn: async () => {
      try {
        const remote = await AdminApi.getPricingSettings();
        if (remote) {
          writeLocalPricingSettings(remote);
        }
        return remote;
      } catch (error) {
        if (isNotFoundError(error)) {
          return readLocalPricingSettings();
        }
        throw error;
      }
    },
    staleTime: 60_000,
  });
  const [pricingRules, setPricingRules] = useState<PricingRuleState>(() => createDefaultPricingRules());
  const [pricingRulesDirty, setPricingRulesDirty] = useState(false);
  const [pricingRulesSuccess, setPricingRulesSuccess] = useState<string | null>(null);
  const [pricingRulesError, setPricingRulesError] = useState<string | null>(null);
  const updatePricingSettings = useMutation<
    { source: "remote" | "local"; payload: PricingSettingsResponse },
    Error,
    PricingSettingsResponse
  >({
    mutationFn: async (payload) => {
      try {
        const saved = await AdminApi.updatePricingSettings(payload);
        const finalPayload = saved ?? payload;
        writeLocalPricingSettings(finalPayload);
        return { source: "remote", payload: finalPayload };
      } catch (error) {
        if (isNotFoundError(error)) {
          writeLocalPricingSettings(payload);
          return { source: "local", payload };
        }
        throw error instanceof Error ? error : new Error("İndirimler kaydedilemedi");
      }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["settings-pricing-settings"] });
      setPricingRulesSuccess(
        result.source === "local"
          ? "Sunucu endpointi hazır değil, ayarlar tarayıcıda saklandı."
          : "İndirim kuralları güncellendi",
      );
      setPricingRulesDirty(false);
    },
    onError: (err) => {
      setPricingRulesError(err?.message ?? "İndirimler kaydedilemedi");
    },
  });

  useEffect(() => {
    if (!normalizedRoomTypes.length) {
      setRoomPricing({});
      return;
    }
    setRoomPricing(
      normalizedRoomTypes.reduce<RoomPricingState>((acc, room) => {
        const rateNumber = Number(room.nightlyRate ?? 0);
        const rate = Number.isFinite(rateNumber) ? rateNumber : 0;
        acc[room.id] = {
          value: String(rate),
          original: String(rate),
        };
        return acc;
      }, {}),
    );
  }, [normalizedRoomTypes]);

  useEffect(() => {
    if (!recentlySavedRoomId) return;
    const timer = window.setTimeout(() => setRecentlySavedRoomId(null), 2500);
    return () => window.clearTimeout(timer);
  }, [recentlySavedRoomId]);

  useEffect(() => {
    if (pricingSettingsQuery.data === undefined) return;
    setPricingRules(mapPricingSettings(pricingSettingsQuery.data));
    setPricingRulesDirty(false);
    setPricingRulesError(null);
  }, [pricingSettingsQuery.data]);

  const hasChanges = dirty && !saving;

  useEffect(() => {
    if (!pricingRulesSuccess) return;
    const timer = window.setTimeout(() => setPricingRulesSuccess(null), 3200);
    return () => window.clearTimeout(timer);
  }, [pricingRulesSuccess]);

  const handleRoomRateChange = (id: string, value: string) => {
    const sanitized = value.replace(/[^\d.,]/g, "");
    setRoomPricing((prev) => ({
      ...prev,
      [id]: {
        value: sanitized,
        original: prev[id]?.original ?? sanitized,
      },
    }));
    setRoomPricingError(null);
  };

  const handleRoomRateSave = (id: string) => {
    const entry = roomPricing[id];
    if (!entry) return;
    const normalized = entry.value.replace(",", ".");
    const parsed = Number(normalized);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setRoomPricingError("Gece fiyatı 0'dan büyük olmalı");
      return;
    }
    setRoomPricingError(null);
    setPendingRoomId(id);
    updateRoomType.mutate(
      { id, payload: { nightlyRate: parsed } },
      {
        onSuccess: () => {
          setRoomPricing((prev) => ({
            ...prev,
            [id]: {
              value: String(parsed),
              original: String(parsed),
            },
          }));
          setRecentlySavedRoomId(id);
        },
        onError: (err: any) => {
          setRoomPricingError(err?.message ?? "Fiyat güncellenemedi");
        },
        onSettled: () => setPendingRoomId(null),
      },
    );
  };

  const markPricingRulesDirty = () => {
    setPricingRulesDirty(true);
    setPricingRulesSuccess(null);
    setPricingRulesError(null);
  };

  const handleMultiCatToggle = (enabled: boolean) => {
    setPricingRules((prev) => {
      if (prev.multiCatEnabled === enabled) return prev;
      markPricingRulesDirty();
      return { ...prev, multiCatEnabled: enabled };
    });
  };

  const handleAddMultiCatTier = (catCount: number, discountPercent: number) => {
    if (catCount < 2) {
      setPricingRulesError("Kedi adedi 2 veya üzerinde olmalı");
      return;
    }
    const clampedDiscount = Math.min(50, Math.max(0, Math.round(discountPercent)));
    setPricingRules((prev) => {
      if (prev.multiCatDiscounts.some((tier) => tier.catCount === catCount)) {
        setPricingRulesError(`${catCount}. kedi için zaten bir indirim var`);
        return prev;
      }
      const updated = [...prev.multiCatDiscounts, { id: generateId(), catCount, discountPercent: clampedDiscount }].sort(
        (a, b) => a.catCount - b.catCount,
      );
      markPricingRulesDirty();
      return { ...prev, multiCatDiscounts: updated };
    });
  };

  const handleRemoveMultiCatTier = (tierId: string) => {
    setPricingRules((prev) => {
      const updated = prev.multiCatDiscounts.filter((tier) => tier.id !== tierId);
      if (updated.length === prev.multiCatDiscounts.length) {
        return prev;
      }
      markPricingRulesDirty();
      return { ...prev, multiCatDiscounts: updated };
    });
  };

  const handleMultiCatTierChange = (tierId: string, percent: number) => {
    const nextValue = Math.min(50, Math.max(0, Math.round(percent)));
    setPricingRules((prev) => {
      let changed = false;
      const updated = prev.multiCatDiscounts.map((tier) => {
        if (tier.id !== tierId) return tier;
        if (tier.discountPercent === nextValue) return tier;
        changed = true;
        return { ...tier, discountPercent: nextValue };
      });
      if (!changed) return prev;
      markPricingRulesDirty();
      return { ...prev, multiCatDiscounts: updated };
    });
  };

  const handleSharedRoomToggle = (enabled: boolean) => {
    setPricingRules((prev) => {
      if (prev.sharedRoomDiscountEnabled === enabled) return prev;
      markPricingRulesDirty();
      return { ...prev, sharedRoomDiscountEnabled: enabled };
    });
  };

  const handleAddSharedRoomTier = (remainingCapacity: number, discountPercent: number) => {
    const capacity = Math.max(1, Math.min(10, Math.round(remainingCapacity)));
    const percent = Math.min(50, Math.max(0, Math.round(discountPercent)));
    setPricingRules((prev) => {
      if (prev.sharedRoomDiscounts.some((tier) => tier.remainingCapacity === capacity)) {
        setPricingRulesError(`Kalan kapasite ${capacity} için zaten indirim tanımlı`);
        return prev;
      }
      markPricingRulesDirty();
      setPricingRulesError(null);
      return {
        ...prev,
        sharedRoomDiscounts: [...prev.sharedRoomDiscounts, { id: generateId(), remainingCapacity: capacity, discountPercent: percent }].sort(
          (a, b) => a.remainingCapacity - b.remainingCapacity,
        ),
      };
    });
  };

  const handleSharedRoomTierChange = (
    tierId: string,
    field: "remainingCapacity" | "discountPercent",
    value: number,
  ) => {
    setPricingRules((prev) => {
      const target = prev.sharedRoomDiscounts.find((tier) => tier.id === tierId);
      if (!target) return prev;
      if (field === "remainingCapacity") {
        const nextValue = Math.max(1, Math.min(10, Math.round(value)));
        if (prev.sharedRoomDiscounts.some((tier) => tier.id !== tierId && tier.remainingCapacity === nextValue)) {
          setPricingRulesError(`Kalan kapasite ${nextValue} için zaten indirim tanımlı`);
          return prev;
        }
        if (target.remainingCapacity === nextValue) return prev;
        markPricingRulesDirty();
        setPricingRulesError(null);
        return {
          ...prev,
          sharedRoomDiscounts: prev.sharedRoomDiscounts
            .map((tier) => (tier.id === tierId ? { ...tier, remainingCapacity: nextValue } : tier))
            .sort((a, b) => a.remainingCapacity - b.remainingCapacity),
        };
      }
      const nextPercent = Math.min(50, Math.max(0, Math.round(value)));
      if (target.discountPercent === nextPercent) return prev;
      markPricingRulesDirty();
      setPricingRulesError(null);
      return {
        ...prev,
        sharedRoomDiscounts: prev.sharedRoomDiscounts.map((tier) =>
          tier.id === tierId ? { ...tier, discountPercent: nextPercent } : tier,
        ),
      };
    });
  };

  const handleRemoveSharedRoomTier = (tierId: string) => {
    setPricingRules((prev) => {
      const updated = prev.sharedRoomDiscounts.filter((tier) => tier.id !== tierId);
      if (updated.length === prev.sharedRoomDiscounts.length) return prev;
      markPricingRulesDirty();
      return { ...prev, sharedRoomDiscounts: updated };
    });
  };

  const handleLongStayToggle = (enabled: boolean) => {
    setPricingRules((prev) => {
      if (prev.longStayDiscount.enabled === enabled) return prev;
      markPricingRulesDirty();
      return { ...prev, longStayDiscount: { ...prev.longStayDiscount, enabled } };
    });
  };

  const handleAddLongStayTier = (minNights: number, discountPercent: number) => {
    const nights = Math.max(3, Math.min(90, Math.round(minNights)));
    const percent = Math.min(50, Math.max(0, Math.round(discountPercent)));
    setPricingRules((prev) => {
      if (prev.longStayDiscount.tiers.some((tier) => tier.minNights === nights)) {
        setPricingRulesError(`${nights} gece için zaten indirim tanımlı`);
        return prev;
      }
      markPricingRulesDirty();
      setPricingRulesError(null);
      return {
        ...prev,
        longStayDiscount: {
          ...prev.longStayDiscount,
          tiers: [...prev.longStayDiscount.tiers, { id: generateId(), minNights: nights, discountPercent: percent }].sort(
            (a, b) => a.minNights - b.minNights,
          ),
        },
      };
    });
  };

  const handleLongStayTierChange = (
    tierId: string,
    field: "minNights" | "discountPercent",
    value: number,
  ) => {
    setPricingRules((prev) => {
      const tier = prev.longStayDiscount.tiers.find((item) => item.id === tierId);
      if (!tier) return prev;
      if (field === "minNights") {
        const nights = Math.max(3, Math.min(120, Math.round(value)));
        if (prev.longStayDiscount.tiers.some((item) => item.id !== tierId && item.minNights === nights)) {
          setPricingRulesError(`${nights} gece için zaten indirim tanımlı`);
          return prev;
        }
        if (tier.minNights === nights) return prev;
        markPricingRulesDirty();
        setPricingRulesError(null);
        return {
          ...prev,
          longStayDiscount: {
            ...prev.longStayDiscount,
            tiers: prev.longStayDiscount.tiers
              .map((item) => (item.id === tierId ? { ...item, minNights: nights } : item))
              .sort((a, b) => a.minNights - b.minNights),
          },
        };
      }
      const nextPercent = Math.min(50, Math.max(0, Math.round(value)));
      if (tier.discountPercent === nextPercent) return prev;
      markPricingRulesDirty();
      setPricingRulesError(null);
      return {
        ...prev,
        longStayDiscount: {
          ...prev.longStayDiscount,
          tiers: prev.longStayDiscount.tiers.map((item) =>
            item.id === tierId ? { ...item, discountPercent: nextPercent } : item,
          ),
        },
      };
    });
  };

  const handleRemoveLongStayTier = (tierId: string) => {
    setPricingRules((prev) => {
      const updated = prev.longStayDiscount.tiers.filter((tier) => tier.id !== tierId);
      if (updated.length === prev.longStayDiscount.tiers.length) return prev;
      markPricingRulesDirty();
      return { ...prev, longStayDiscount: { ...prev.longStayDiscount, tiers: updated } };
    });
  };

  const handleSavePricingRules = () => {
    if (!pricingRulesDirty) return;
    setPricingRulesError(null);
    setPricingRulesSuccess(null);
    updatePricingSettings.mutate(serializePricingSettings(pricingRules));
  };

  const handleGeneralChange = (field: keyof GeneralFormValues, value: string) => {
    setGeneralValues((prev) => ({ ...prev, [field]: value }));
    setDirty(true);
  };

  const handleLogoUpload = (fileName: string) => {
    setLogoName(fileName);
    setDirty(true);
  };

  const handleSave = () => {
    if (!hasChanges) return;
    setSaving(true);
    window.setTimeout(() => {
      setSaving(false);
      setDirty(false);
      setSaveBanner("Ayarlar başarıyla kaydedildi");
      window.setTimeout(() => setSaveBanner(null), 3200);
    }, 1200);
  };

  const openTemplateModal = (channel: TemplateChannel, id: string) => {
    const source = channel === "email" ? emailTemplates : smsTemplates;
    const template = source.find((tpl) => tpl.id === id);
    if (!template) return;
    setModalPayload({ channel, template });
  };

  const handleTemplateSave = (channel: TemplateChannel, templateId: string, updated: Template) => {
    if (channel === "email") {
      setEmailTemplates((prev) => prev.map((tpl) => (tpl.id === templateId ? { ...tpl, ...updated } : tpl)));
    } else {
      setSmsTemplates((prev) => prev.map((tpl) => (tpl.id === templateId ? { ...tpl, ...updated } : tpl)));
    }
    setDirty(true);
    setModalPayload(null);
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--admin-muted)]">Kontrol Paneli</p>
          <h1 className="mt-1 text-3xl font-semibold text-[var(--admin-text-strong)]">Ayarlar</h1>
          <p className="mt-1 text-sm text-[var(--admin-muted)]">Otel bilgilerini ve sistem ayarlarını yönetin.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {saveBanner && (
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 dark:border-emerald-700/60 dark:bg-emerald-500/10 dark:text-emerald-200">
              <CheckCircle2 className="h-4 w-4" aria-hidden />
              {saveBanner}
            </span>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={!hasChanges}
            className={clsx(
              "inline-flex items-center gap-2 rounded-full bg-peach-400 px-5 py-2.5 text-sm font-semibold text-white shadow-glow transition",
              hasChanges ? "hover:-translate-y-0.5" : "opacity-60",
            )}
          >
            {saving ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
          </button>
        </div>
      </header>

      <div className="flex flex-col gap-6 lg:flex-row">
        <aside className="w-full lg:w-64">
          <nav className="rounded-3xl border bg-[var(--admin-surface)] p-2 admin-border">
            {tabItems.map((tab) => {
              const active = tab.id === activeTab;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={clsx(
                    "relative flex w-full flex-col rounded-2xl px-4 py-3 text-left transition",
                    active
                      ? "bg-[var(--admin-highlight-muted)] text-[var(--admin-text-strong)]"
                      : "text-[var(--admin-muted)] hover:bg-[var(--admin-highlight-muted)]/60",
                  )}
                >
                  <span className="flex items-center gap-3 text-sm font-semibold">
                    <span>{tab.label}</span>
                    {tab.comingSoon && (
                      <span className="rounded-full bg-[var(--admin-border)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em]">
                        yakında
                      </span>
                    )}
                  </span>
                  <span className="text-xs text-[var(--admin-muted)]">{tab.description}</span>
                  <span
                    className={clsx(
                      "absolute inset-y-3 left-2 w-1 rounded-full",
                      active ? "bg-peach-400" : "bg-transparent",
                    )}
                    aria-hidden
                  />
                </button>
              );
            })}
          </nav>
        </aside>
        <div className="flex-1 space-y-6">
          {activeTab === "general" && (
            <GeneralSettingsCard values={generalValues} logoName={logoName} onChange={handleGeneralChange} onLogoUpload={handleLogoUpload} />
          )}
          {activeTab === "pricing" && (
            <>
              <PricingSettingsCard
                roomTypes={normalizedRoomTypes}
                roomPricing={roomPricing}
                onChangeRate={handleRoomRateChange}
                onSaveRate={handleRoomRateSave}
                loading={roomTypeQuery.isLoading}
                pendingId={pendingRoomId}
                recentlySavedId={recentlySavedRoomId}
                error={roomPricingError}
              />
              <DiscountSettingsCard
                value={pricingRules}
                loading={pricingSettingsQuery.isLoading}
                dirty={pricingRulesDirty}
                saving={updatePricingSettings.isPending}
                successMessage={pricingRulesSuccess}
                errorMessage={pricingRulesError}
                onMultiCatToggle={handleMultiCatToggle}
                onAddMultiCatTier={handleAddMultiCatTier}
                onRemoveMultiCatTier={handleRemoveMultiCatTier}
                onMultiCatTierChange={handleMultiCatTierChange}
                onSharedRoomToggle={handleSharedRoomToggle}
                onAddSharedRoomTier={handleAddSharedRoomTier}
                onSharedRoomTierChange={handleSharedRoomTierChange}
                onRemoveSharedRoomTier={handleRemoveSharedRoomTier}
                onLongStayToggle={handleLongStayToggle}
                onAddLongStayTier={handleAddLongStayTier}
                onLongStayTierChange={handleLongStayTierChange}
                onRemoveLongStayTier={handleRemoveLongStayTier}
                onSave={handleSavePricingRules}
              />
            </>
          )}
          {activeTab === "notifications" && (
            <NotificationSettingsCard emailTemplates={emailTemplates} smsTemplates={smsTemplates} onEdit={openTemplateModal} />
          )}
          {activeTab === "roles" && <RolesPlaceholderCard />}
        </div>
      </div>

      {modalPayload && (
        <TemplateModal
          channel={modalPayload.channel}
          template={modalPayload.template}
          onClose={() => setModalPayload(null)}
          onSave={(payload) => handleTemplateSave(modalPayload.channel, modalPayload.template.id, payload)}
        />
      )}
    </div>
  );
}

function NotificationSettingsCard({
  emailTemplates,
  smsTemplates,
  onEdit,
}: {
  emailTemplates: Template[];
  smsTemplates: Template[];
  onEdit: (channel: TemplateChannel, id: string) => void;
}) {
  const placeholderList = useMemo(() => ["{kedi_adı}", "{musteri_adi}", "{giris_tarihi}", "{cikis_tarihi}", "{oda_adi}"], []);

  return (
    <SettingsCard title="Bildirim Şablonları" description="Email ve SMS otomasyon şablonlarını özelleştirin.">
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-peach-400" aria-hidden />
          <h4 className="text-sm font-semibold text-[var(--admin-text-strong)]">Email Şablonları</h4>
        </div>
        <div className="divide-y rounded-2xl border admin-border">
          {emailTemplates.map((template) => (
            <div key={template.id} className="flex flex-col gap-2 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-[var(--admin-text-strong)]">{template.name}</p>
                {template.subject && <p className="text-xs text-[var(--admin-muted)]">{template.subject}</p>}
              </div>
              <button
                type="button"
                onClick={() => onEdit("email", template.id)}
                className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold text-[var(--admin-text-strong)] transition hover:-translate-y-0.5 hover:border-peach-300 hover:text-peach-500 admin-border"
              >
                <Edit3 className="h-4 w-4" aria-hidden />
                Düzenle
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-peach-400" aria-hidden />
          <h4 className="text-sm font-semibold text-[var(--admin-text-strong)]">SMS Şablonları</h4>
        </div>
        <div className="divide-y rounded-2xl border admin-border">
          {smsTemplates.map((template) => (
            <div key={template.id} className="flex flex-col gap-2 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-[var(--admin-text-strong)]">{template.name}</p>
                <p className="text-xs text-[var(--admin-muted)]">
                  {template.body.length > 72 ? `${template.body.slice(0, 72)}...` : template.body}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onEdit("sms", template.id)}
                className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold text-[var(--admin-text-strong)] transition hover:-translate-y-0.5 hover:border-peach-300 hover:text-peach-500 admin-border"
              >
                <Edit3 className="h-4 w-4" aria-hidden />
                Düzenle
              </button>
            </div>
          ))}
        </div>
      </section>

      <div className="flex items-start gap-3 rounded-2xl border border-dashed border-[var(--admin-border)] bg-[var(--admin-surface-alt)] px-4 py-3 text-xs text-[var(--admin-muted)]">
        <AlertCircle className="h-4 w-4 text-peach-400" aria-hidden />
        <div>
          <p className="font-semibold text-[var(--admin-text-strong)]">Otomatik gönderimler</p>
          <p>Bu şablonlar müşterilere otomatik gönderilen mesajlarda kullanılacaktır.</p>
          <div className="mt-2 flex flex-wrap gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--admin-muted)]">
            {placeholderList.map((item) => (
              <span key={item} className="rounded-full bg-[var(--admin-surface)] px-2 py-1">
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </SettingsCard>
  );
}

function GeneralSettingsCard({
  values,
  logoName,
  onChange,
  onLogoUpload,
}: {
  values: GeneralFormValues;
  logoName: string | null;
  onChange: (field: keyof GeneralFormValues, value: string) => void;
  onLogoUpload: (fileName: string) => void;
}) {
  return (
    <div className="space-y-6">
      <SettingsCard title="Otel Bilgileri" description="Otelin temel kimlik bilgilerini güncelleyin. Logo alanı tüm uygulamada paylaşılır.">
        <div className="grid gap-5 lg:grid-cols-2">
          <FormField label="Otel Adı">
            <input
              value={values.hotelName}
              onChange={(event) => onChange("hotelName", event.target.value)}
              placeholder="Otel adı"
              className={inputClasses}
            />
          </FormField>
          <FormField label="Telefon Numarası">
            <input
              value={values.phone}
              onChange={(event) => onChange("phone", event.target.value)}
              placeholder="+90 ..."
              className={inputClasses}
            />
          </FormField>
          <FormField label="E-posta">
            <input
              type="email"
              value={values.email}
              onChange={(event) => onChange("email", event.target.value)}
              placeholder="info@miaowhotel.com"
              className={inputClasses}
            />
          </FormField>
          <FormField label="Adres">
            <textarea
              rows={3}
              value={values.address}
              onChange={(event) => onChange("address", event.target.value)}
              placeholder="Adres"
              className={`${inputClasses} rounded-3xl resize-none`}
            />
          </FormField>
        </div>

        <div className="grid gap-4 md:grid-cols-[auto_1fr]">
          <div className="flex items-center justify-center rounded-2xl border bg-[var(--admin-surface-alt)] p-6 text-center admin-border">
            <div className="flex flex-col items-center gap-3">
              <span className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[var(--admin-highlight-muted)] text-xl font-semibold text-peach-500">
                {logoName ? logoName.slice(0, 2).toUpperCase() : "MH"}
              </span>
              <p className="text-sm font-semibold text-[var(--admin-text-strong)]">{logoName ?? "Logo yüklenmedi"}</p>
              <p className="text-xs text-[var(--admin-muted)]">Kare veya dairesel logolar desteklenir.</p>
            </div>
          </div>
          <div className="flex flex-col space-y-3 rounded-2xl border border-dashed border-[var(--admin-border)] bg-[var(--admin-surface-alt)] p-4">
            <p className="text-sm font-semibold">Logo Yükle</p>
            <p className="text-xs text-[var(--admin-muted)]">PNG, SVG veya JPG. Önerilen boyut 512x512 px.</p>
            <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[var(--admin-border)] bg-[var(--admin-surface)] px-6 py-8 text-center transition hover:border-peach-300">
              <UploadCloud className="h-8 w-8 text-peach-400" aria-hidden />
              <span className="text-sm font-semibold text-[var(--admin-text-strong)]">Dosya yükle</span>
              <input
                type="file"
                className="sr-only"
                accept="image/png,image/jpeg,image/svg+xml"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) onLogoUpload(file.name);
                }}
              />
              <span className="text-xs text-[var(--admin-muted)]">Sürükleyip bırakabilirsiniz.</span>
            </label>
          </div>
        </div>
      </SettingsCard>

      <SettingsCard title="İletişim Tercihleri" description="İletişim e-postası rezervasyon onaylarında kullanılacaktır.">
        <FormField label="İletişim E-postası">
          <input
            type="email"
            value={values.contactEmail}
            onChange={(event) => onChange("contactEmail", event.target.value)}
            placeholder="reservations@miaowhotel.com"
            className={inputClasses}
          />
        </FormField>
      </SettingsCard>
    </div>
  );
}

function PricingSettingsCard({
  roomTypes,
  roomPricing,
  onChangeRate,
  onSaveRate,
  loading,
  pendingId,
  recentlySavedId,
  error,
}: {
  roomTypes: RoomType[];
  roomPricing: RoomPricingState;
  onChangeRate: (id: string, value: string) => void;
  onSaveRate: (id: string) => void;
  loading: boolean;
  pendingId: string | null;
  recentlySavedId: string | null;
  error?: string | null;
}) {
  const hasRooms = roomTypes.length > 0;
  return (
    <SettingsCard
      title="Oda Tipi Fiyatları"
      description="Fiyatlar gerçek oda tipi kayıtlarından çekilir. Her satırdan güncelleme yaparak yeni ücreti anında kaydedebilirsiniz."
    >
      <div className="rounded-2xl border admin-border">
        <div className="hidden grid-cols-[2fr_1fr_1fr] bg-[var(--admin-surface-alt)] px-4 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-[var(--admin-muted)] lg:grid">
          <span>Oda Tipi</span>
          <span>Günlük Fiyat</span>
          <span>Eylem</span>
        </div>
        {loading && (
          <div className="flex items-center gap-3 px-4 py-4 text-sm text-[var(--admin-muted)]">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Oda tipleri yükleniyor...
          </div>
        )}
        {!loading && !hasRooms && (
          <div className="px-4 py-4 text-sm text-[var(--admin-muted)]">Henüz tanımlı oda tipi yok.</div>
        )}
        <div className="divide-y admin-border">
          {roomTypes.map((room) => {
            const current = roomPricing[room.id];
            const value = current?.value ?? String(room.nightlyRate ?? 0);
            const original = current?.original ?? value;
            const isDirty = value !== original;
            const isPending = pendingId === room.id;
            const isRecentlySaved = recentlySavedId === room.id;
            return (
              <div
                key={room.id}
                className="grid grid-cols-1 gap-4 px-4 py-4 text-sm text-[var(--admin-text-strong)] lg:grid-cols-[2fr_1fr_1fr] lg:items-center"
              >
                <div>
                  <p className="font-semibold">{room.name}</p>
                  <p className="text-xs text-[var(--admin-muted)]">
                    Kapasite: {room.capacity} kedi · Toplam oda: {room.totalUnits ?? 0}
                  </p>
                </div>
                <div className="flex items-center gap-2 rounded-2xl border bg-[var(--admin-surface)] px-3 py-2 admin-border">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={value}
                    onChange={(event) => onChangeRate(room.id, event.target.value)}
                    className="w-full bg-transparent text-sm font-semibold focus:outline-none"
                    aria-label={`${room.name} fiyatı`}
                  />
                  <span className="text-xs text-[var(--admin-muted)]">TRY</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onSaveRate(room.id)}
                    disabled={!isDirty || isPending}
                    className={clsx(
                      "inline-flex items-center gap-2 rounded-full bg-peach-400 px-4 py-2 text-xs font-semibold text-white shadow-glow transition",
                      isDirty && !isPending ? "hover:-translate-y-0.5" : "opacity-50",
                    )}
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                        Kaydediliyor
                      </>
                    ) : (
                      <>
                        <FileText className="h-4 w-4" aria-hidden />
                        Kaydet
                      </>
                    )}
                  </button>
                  {isRecentlySaved && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-100">
                      <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                      Güncellendi
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {error && (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{error}</div>
      )}
    </SettingsCard>
  );
}

﻿function DiscountSettingsCard({
  value,
  loading,
  dirty,
  saving,
  successMessage,
  errorMessage,
  onMultiCatToggle,
  onAddMultiCatTier,
  onRemoveMultiCatTier,
  onMultiCatTierChange,
  onSharedRoomToggle,
  onAddSharedRoomTier,
  onSharedRoomTierChange,
  onRemoveSharedRoomTier,
  onLongStayToggle,
  onAddLongStayTier,
  onLongStayTierChange,
  onRemoveLongStayTier,
  onSave,
}: {
  value: PricingRuleState;
  loading: boolean;
  dirty: boolean;
  saving: boolean;
  successMessage: string | null;
  errorMessage: string | null;
  onMultiCatToggle: (enabled: boolean) => void;
  onAddMultiCatTier: (catCount: number, discountPercent: number) => void;
  onRemoveMultiCatTier: (id: string) => void;
  onMultiCatTierChange: (id: string, percent: number) => void;
  onSharedRoomToggle: (enabled: boolean) => void;
  onAddSharedRoomTier: (remainingCapacity: number, discountPercent: number) => void;
  onSharedRoomTierChange: (id: string, field: "remainingCapacity" | "discountPercent", value: number) => void;
  onRemoveSharedRoomTier: (id: string) => void;
  onLongStayToggle: (enabled: boolean) => void;
  onAddLongStayTier: (minNights: number, discountPercent: number) => void;
  onLongStayTierChange: (id: string, field: "minNights" | "discountPercent", value: number) => void;
  onRemoveLongStayTier: (id: string) => void;
  onSave: () => void;
}) {
  const [newTierCats, setNewTierCats] = useState(2);
  const [newTierDiscount, setNewTierDiscount] = useState(5);
  const [newSharedCapacity, setNewSharedCapacity] = useState(1);
  const [newSharedDiscount, setNewSharedDiscount] = useState(5);
  const [newLongStayNights, setNewLongStayNights] = useState(7);
  const [newLongStayDiscount, setNewLongStayDiscount] = useState(5);

  return (
    <SettingsCard
      title="İndirim Kuralları"
      description="Çok kedili rezervasyonlar, paylaşmalı oda tercihleri ve uzun konaklamalar için otomatik indirimleri yönetin."
    >
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-[var(--admin-text-strong)]">Kedi Başına İndirim</p>
            <p className="text-xs text-[var(--admin-muted)]">Her ekstra kedi için uygulanan otomatik yüzdelik indirimleri tanımlayın.</p>
          </div>
          <label className="relative inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              className="peer sr-only"
              checked={value.multiCatEnabled}
              onChange={(event) => onMultiCatToggle(event.target.checked)}
            />
            <div className="h-6 w-11 rounded-full bg-[var(--admin-border)] transition peer-checked:bg-peach-400">
              <div className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition peer-checked:translate-x-5 shadow" />
            </div>
          </label>
        </div>
        {loading && (
          <p className="text-xs text-[var(--admin-muted)]">Mevcut kurallar yükleniyor...</p>
        )}
        {value.multiCatEnabled ? (
          <>
            <div className="space-y-3">
              {value.multiCatDiscounts.length === 0 && (
                <p className="text-xs text-[var(--admin-muted)]">Henüz tanımlı kedi indirimi yok.</p>
              )}
              {value.multiCatDiscounts.map((tier) => (
                <div
                  key={tier.id}
                  className="flex flex-col gap-3 rounded-2xl border bg-[var(--admin-surface)] p-4 text-sm font-semibold text-[var(--admin-text-strong)] shadow-sm admin-border sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-2 text-sm">
                    <span className="inline-flex items-center gap-1 rounded-full bg-[var(--admin-highlight-muted)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]">
                      {tier.catCount}. kedi
                    </span>
                    için
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 rounded-full border bg-[var(--admin-surface-alt)] px-3 py-1 admin-border">
                      <input
                        type="number"
                        min={0}
                        max={50}
                        value={tier.discountPercent}
                        onChange={(event) => onMultiCatTierChange(tier.id, Number(event.target.value))}
                        className="w-16 bg-transparent text-sm font-semibold text-[var(--admin-text-strong)] focus:outline-none"
                      />
                      <Percent className="h-4 w-4 text-[var(--admin-muted)]" aria-hidden />
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemoveMultiCatTier(tier.id)}
                      className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold text-red-500 transition hover:-translate-y-0.5 hover:border-red-200 hover:bg-red-50/70"
                      aria-label={`${tier.catCount}. kedi indirimini sil`}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                      Sil
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="rounded-2xl border border-dashed border-[var(--admin-border)] bg-[var(--admin-surface-alt)] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--admin-muted)]">Yeni İndirim Kuralı</p>
              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex items-center gap-2 rounded-full border bg-[var(--admin-surface)] px-3 py-1.5 admin-border">
                  <span className="text-xs font-semibold text-[var(--admin-muted)]">Kedi adedi</span>
                  <input
                    type="number"
                    min={2}
                    max={10}
                    value={newTierCats}
                    onChange={(event) => setNewTierCats(Number(event.target.value))}
                    className="w-20 bg-transparent text-sm font-semibold text-[var(--admin-text-strong)] focus:outline-none"
                  />
                </div>
                <div className="flex items-center gap-2 rounded-full border bg-[var(--admin-surface)] px-3 py-1.5 admin-border">
                  <span className="text-xs font-semibold text-[var(--admin-muted)]">İndirim</span>
                  <input
                    type="number"
                    min={0}
                    max={50}
                    value={newTierDiscount}
                    onChange={(event) => setNewTierDiscount(Number(event.target.value))}
                    className="w-20 bg-transparent text-sm font-semibold text-[var(--admin-text-strong)] focus:outline-none"
                  />
                  <Percent className="h-4 w-4 text-[var(--admin-muted)]" aria-hidden />
                </div>
                <button
                  type="button"
                  onClick={() => onAddMultiCatTier(newTierCats, newTierDiscount)}
                  className="inline-flex items-center gap-2 rounded-full bg-[var(--admin-highlight)] px-4 py-2 text-xs font-semibold text-peach-500 transition hover:-translate-y-0.5"
                >
                  <PlusCircle className="h-4 w-4" aria-hidden />
                  Ekle
                </button>
              </div>
            </div>
          </>
        ) : (
          <p className="text-xs text-[var(--admin-muted)]">Bu indirim pasif, tekrar aktifleştirene kadar uygulanmaz.</p>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-[var(--admin-text-strong)]">Paylaşımlı Oda İndirimi</p>
            <p className="text-xs text-[var(--admin-muted)]">
              Kalan kapasiteye göre paylaşmalı oda tercihinde otomatik uygulanacak indirim yüzdelerini tanımlayın.
            </p>
          </div>
          <label className="relative inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              className="peer sr-only"
              checked={value.sharedRoomDiscountEnabled}
              onChange={(event) => onSharedRoomToggle(event.target.checked)}
            />
            <div className="h-6 w-11 rounded-full bg-[var(--admin-border)] transition peer-checked:bg-peach-400">
              <div className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition peer-checked:translate-x-5 shadow" />
            </div>
          </label>
        </div>
        {value.sharedRoomDiscountEnabled ? (
          <>
            <div className="space-y-3">
              {value.sharedRoomDiscounts.length === 0 && (
                <p className="text-xs text-[var(--admin-muted)]">Henüz tanımlı paylaşım indirimi yok.</p>
              )}
              {value.sharedRoomDiscounts.map((tier) => (
                <div
                  key={tier.id}
                  className="rounded-2xl border bg-[var(--admin-surface)] p-4 text-sm font-semibold text-[var(--admin-text-strong)] admin-border"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="inline-flex items-center gap-1 rounded-full bg-[var(--admin-highlight-muted)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]">
                        {tier.remainingCapacity} boş slot
                      </span>
                      kaldığında
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex items-center gap-2 rounded-full border bg-[var(--admin-surface-alt)] px-3 py-1 admin-border">
                        <span className="text-xs font-semibold text-[var(--admin-muted)]">Boş slot</span>
                        <input
                          type="number"
                          min={1}
                          max={10}
                          value={tier.remainingCapacity}
                          onChange={(event) => onSharedRoomTierChange(tier.id, "remainingCapacity", Number(event.target.value))}
                          className="w-16 bg-transparent text-sm font-semibold text-[var(--admin-text-strong)] focus:outline-none"
                        />
                      </div>
                      <div className="flex items-center gap-2 rounded-full border bg-[var(--admin-surface-alt)] px-3 py-1 admin-border">
                        <input
                          type="number"
                          min={0}
                          max={50}
                          value={tier.discountPercent}
                          onChange={(event) => onSharedRoomTierChange(tier.id, "discountPercent", Number(event.target.value))}
                          className="w-16 bg-transparent text-sm font-semibold text-[var(--admin-text-strong)] focus:outline-none"
                        />
                        <Percent className="h-4 w-4 text-[var(--admin-muted)]" aria-hidden />
                      </div>
                      <button
                        type="button"
                        onClick={() => onRemoveSharedRoomTier(tier.id)}
                        className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold text-red-500 transition hover:-translate-y-0.5 hover:border-red-200 hover:bg-red-50/70"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden />
                        Sil
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="rounded-2xl border border-dashed border-[var(--admin-border)] bg-[var(--admin-surface-alt)] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--admin-muted)]">Yeni Kalan Kapasite Kuralı</p>
              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex items-center gap-2 rounded-full border bg-[var(--admin-surface)] px-3 py-1.5 admin-border">
                  <span className="text-xs font-semibold text-[var(--admin-muted)]">Boş slot</span>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={newSharedCapacity}
                    onChange={(event) => setNewSharedCapacity(Number(event.target.value))}
                    className="w-20 bg-transparent text-sm font-semibold text-[var(--admin-text-strong)] focus:outline-none"
                  />
                </div>
                <div className="flex items-center gap-2 rounded-full border bg-[var(--admin-surface)] px-3 py-1.5 admin-border">
                  <span className="text-xs font-semibold text-[var(--admin-muted)]">İndirim</span>
                  <input
                    type="number"
                    min={0}
                    max={50}
                    value={newSharedDiscount}
                    onChange={(event) => setNewSharedDiscount(Number(event.target.value))}
                    className="w-20 bg-transparent text-sm font-semibold text-[var(--admin-text-strong)] focus:outline-none"
                  />
                  <Percent className="h-4 w-4 text-[var(--admin-muted)]" aria-hidden />
                </div>
                <button
                  type="button"
                  onClick={() => onAddSharedRoomTier(newSharedCapacity, newSharedDiscount)}
                  className="inline-flex items-center gap-2 rounded-full bg-[var(--admin-highlight)] px-4 py-2 text-xs font-semibold text-peach-500 transition hover:-translate-y-0.5"
                >
                  <PlusCircle className="h-4 w-4" aria-hidden />
                  Ekle
                </button>
              </div>
            </div>
          </>
        ) : (
          <p className="text-xs text-[var(--admin-muted)]">Paylaşmalı oda indirimi devre dışı bırakıldı.</p>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-[var(--admin-text-strong)]">Uzun Konaklama İndirimleri</p>
            <p className="text-xs text-[var(--admin-muted)]">Belirli gece sayısını aşan rezervasyonlara kademeli indirim uygulayın.</p>
          </div>
          <label className="relative inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              className="peer sr-only"
              checked={value.longStayDiscount.enabled}
              onChange={(event) => onLongStayToggle(event.target.checked)}
            />
            <div className="h-6 w-11 rounded-full bg-[var(--admin-border)] transition peer-checked:bg-peach-400">
              <div className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition peer-checked:translate-x-5 shadow" />
            </div>
          </label>
        </div>
        {value.longStayDiscount.enabled ? (
          <>
            <div className="space-y-3">
              {value.longStayDiscount.tiers.length === 0 && (
                <p className="text-xs text-[var(--admin-muted)]">Henüz tanımlı uzun konaklama indirimi yok.</p>
              )}
              {value.longStayDiscount.tiers.map((tier) => (
                <div
                  key={tier.id}
                  className="rounded-2xl border bg-[var(--admin-surface)] p-4 text-sm font-semibold text-[var(--admin-text-strong)] admin-border"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="inline-flex items-center gap-1 rounded-full bg-[var(--admin-highlight-muted)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]">
                        {tier.minNights}+ gece
                      </span>
                      kalan rezervasyonlara
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex items-center gap-2 rounded-full border bg-[var(--admin-surface-alt)] px-3 py-1 admin-border">
                        <span className="text-xs font-semibold text-[var(--admin-muted)]">Gece</span>
                        <input
                          type="number"
                          min={3}
                          max={120}
                          value={tier.minNights}
                          onChange={(event) => onLongStayTierChange(tier.id, "minNights", Number(event.target.value))}
                          className="w-20 bg-transparent text-sm font-semibold text-[var(--admin-text-strong)] focus:outline-none"
                        />
                      </div>
                      <div className="flex items-center gap-2 rounded-full border bg-[var(--admin-surface-alt)] px-3 py-1 admin-border">
                        <input
                          type="number"
                          min={0}
                          max={50}
                          value={tier.discountPercent}
                          onChange={(event) => onLongStayTierChange(tier.id, "discountPercent", Number(event.target.value))}
                          className="w-16 bg-transparent text-sm font-semibold text-[var(--admin-text-strong)] focus:outline-none"
                        />
                        <Percent className="h-4 w-4 text-[var(--admin-muted)]" aria-hidden />
                      </div>
                      <button
                        type="button"
                        onClick={() => onRemoveLongStayTier(tier.id)}
                        className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold text-red-500 transition hover:-translate-y-0.5 hover:border-red-200 hover:bg-red-50/70"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden />
                        Sil
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="rounded-2xl border border-dashed border-[var(--admin-border)] bg-[var(--admin-surface-alt)] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--admin-muted)]">Yeni Konaklama Kademesi</p>
              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex items-center gap-2 rounded-full border bg-[var(--admin-surface)] px-3 py-1.5 admin-border">
                  <span className="text-xs font-semibold text-[var(--admin-muted)]">Gece</span>
                  <input
                    type="number"
                    min={3}
                    max={120}
                    value={newLongStayNights}
                    onChange={(event) => setNewLongStayNights(Number(event.target.value))}
                    className="w-20 bg-transparent text-sm font-semibold text-[var(--admin-text-strong)] focus:outline-none"
                  />
                </div>
                <div className="flex items-center gap-2 rounded-full border bg-[var(--admin-surface)] px-3 py-1.5 admin-border">
                  <span className="text-xs font-semibold text-[var(--admin-muted)]">İndirim</span>
                  <input
                    type="number"
                    min={0}
                    max={50}
                    value={newLongStayDiscount}
                    onChange={(event) => setNewLongStayDiscount(Number(event.target.value))}
                    className="w-20 bg-transparent text-sm font-semibold text-[var(--admin-text-strong)] focus:outline-none"
                  />
                  <Percent className="h-4 w-4 text-[var(--admin-muted)]" aria-hidden />
                </div>
                <button
                  type="button"
                  onClick={() => onAddLongStayTier(newLongStayNights, newLongStayDiscount)}
                  className="inline-flex items-center gap-2 rounded-full bg-[var(--admin-highlight)] px-4 py-2 text-xs font-semibold text-peach-500 transition hover:-translate-y-0.5"
                >
                  <PlusCircle className="h-4 w-4" aria-hidden />
                  Ekle
                </button>
              </div>
            </div>
          </>
        ) : (
          <p className="text-xs text-[var(--admin-muted)]">Uzun konaklama indirimi devre dışı bırakıldı.</p>
        )}
      </section>

      <AddonServicesCard />

      {errorMessage && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{errorMessage}</div>
      )}
      {successMessage && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-600">
          {successMessage}
        </div>
      )}

      <div className="flex items-center justify-end pt-2">
        <button
          type="button"
          onClick={onSave}
          disabled={!dirty || saving}
          className={clsx(
            "inline-flex items-center gap-2 rounded-full bg-peach-400 px-5 py-2.5 text-sm font-semibold text-white shadow-glow transition",
            dirty && !saving ? "hover:-translate-y-0.5" : "opacity-60",
          )}
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Kaydediliyor
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4" aria-hidden />
              İndirimleri Kaydet
            </>
          )}
        </button>
      </div>
    </SettingsCard>
  );
}
function RolesPlaceholderCard() {
  return (
    <SettingsCard title="Kullanıcı & Rol Yönetimi" description="Güvenlik, yetki ve ekip yönetimi için kapsamlı araçlar yakında ekleniyor.">
      <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-[var(--admin-border)] bg-[var(--admin-surface-alt)] px-6 py-12 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--admin-highlight-muted)] text-peach-500">
          <Users2 className="h-7 w-7" aria-hidden />
        </div>
        <div>
          <p className="text-lg font-semibold text-[var(--admin-text-strong)]">Kullanıcı & Rol Yönetimi Yakında</p>
          <p className="mt-2 text-sm text-[var(--admin-muted)]">Bu özellik ilerleyen sürümlerde aktif olacaktır. Ekibinizi rollerle özelleştirebileceksiniz.</p>
        </div>
      </div>
    </SettingsCard>
  );
}

function SettingsCard({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-3xl border bg-[var(--admin-surface)] p-6 shadow-sm admin-border">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--admin-muted)]">Ayar bloğu</p>
          <h3 className="text-xl font-semibold text-[var(--admin-text-strong)]">{title}</h3>
          {description && <p className="mt-1 text-sm text-[var(--admin-muted)]">{description}</p>}
        </div>
        {action}
      </header>
      <div className="mt-6 space-y-5">{children}</div>
    </section>
  );
}

function AddonServicesCard() {
  const queryClient = useQueryClient();
  const addonServicesQuery = useQuery({
    queryKey: ["admin-addon-services"],
    queryFn: () => AdminApi.listAddonServices(),
    staleTime: 30_000,
  });
  const [form, setForm] = useState({ name: "", description: "", price: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingForm, setEditingForm] = useState({
    name: "",
    description: "",
    price: "",
    isActive: true,
  });
  const [addonError, setAddonError] = useState<string | null>(null);
  const [addonSuccess, setAddonSuccess] = useState<string | null>(null);
  const createAddonService = useMutation({
    mutationFn: (payload: { name: string; description?: string | null; price: number }) =>
      AdminApi.createAddonService(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-addon-services"] });
      setForm({ name: "", description: "", price: "" });
      setAddonSuccess("Ek hizmet eklendi");
    },
    onError: (error: any) => {
      setAddonError(error?.message ?? "Ek hizmet eklenemedi");
    },
  });
  const updateAddonService = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: { name?: string; description?: string | null; price?: number; isActive?: boolean };
    }) => AdminApi.updateAddonService(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-addon-services"] });
      setAddonSuccess("Ek hizmet güncellendi");
    },
    onError: (error: any) => setAddonError(error?.message ?? "Ek hizmet güncellenemedi"),
  });
  const deleteAddonService = useMutation({
    mutationFn: (id: string) => AdminApi.deleteAddonService(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-addon-services"] });
      setAddonSuccess("Ek hizmet silindi");
    },
    onError: (error: any) => setAddonError(error?.message ?? "Ek hizmet silinemedi"),
  });

  useEffect(() => {
    if (!addonSuccess) return;
    const timer = window.setTimeout(() => setAddonSuccess(null), 3200);
    return () => window.clearTimeout(timer);
  }, [addonSuccess]);

  const services = useMemo(
    () =>
      (addonServicesQuery.data ?? []).slice().sort((a, b) => a.name.localeCompare(b.name)),
    [addonServicesQuery.data],
  );

  const parsePrice = (value: string) => {
    const normalized = Number(value.replace(',', '.'));
    return Number.isFinite(normalized) ? normalized : NaN;
  };

  const formatPrice = (value: number | string) =>
    new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Number(value) || 0);

  const handleCreate = async () => {
    setAddonError(null);
    const name = form.name.trim();
    const priceValue = parsePrice(form.price);
    if (!name) {
      setAddonError("Hizmet adı zorunlu");
      return;
    }
    if (!Number.isFinite(priceValue) || priceValue < 0) {
      setAddonError("Fiyat 0 veya daha büyük olmalı");
      return;
    }
    await createAddonService.mutateAsync({
      name,
      description: form.description.trim() || undefined,
      price: priceValue,
    });
  };

  const startEditing = (service: AdminAddonService) => {
    setEditingId(service.id);
    setEditingForm({
      name: service.name,
      description: service.description ?? "",
      price: String(service.price ?? ""),
      isActive: service.isActive,
    });
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    setAddonError(null);
    const name = editingForm.name.trim();
    const priceValue = parsePrice(editingForm.price);
    if (!name) {
      setAddonError("Hizmet adı zorunlu");
      return;
    }
    if (!Number.isFinite(priceValue) || priceValue < 0) {
      setAddonError("Fiyat 0 veya daha büyük olmalı");
      return;
    }
    await updateAddonService.mutateAsync({
      id: editingId,
      payload: {
        name,
        description: editingForm.description.trim() || null,
        price: priceValue,
        isActive: editingForm.isActive,
      },
    });
    setEditingId(null);
  };

  const handleToggleActive = async (service: AdminAddonService, next: boolean) => {
    setAddonError(null);
    await updateAddonService.mutateAsync({
      id: service.id,
      payload: { isActive: next },
    });
  };

  const handleDelete = async (service: AdminAddonService) => {
    if (!window.confirm(`"${service.name}" hizmetini silmek istediğine emin misin?`)) {
      return;
    }
    setAddonError(null);
    await deleteAddonService.mutateAsync(service.id);
    if (editingId === service.id) {
      setEditingId(null);
    }
  };

  return (
    <section className="space-y-4 rounded-3xl border bg-[var(--admin-surface)] p-6 shadow-sm admin-border">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--admin-muted)]">
            Ek hizmetler
          </p>
          <h3 className="text-xl font-semibold text-[var(--admin-text-strong)]">
            Rezervasyon eklentileri
          </h3>
          <p className="mt-1 text-sm text-[var(--admin-muted)]">
            Rezervasyon sırasında sunulacak ek hizmetleri tanımla ve fiyatlandır.
          </p>
        </div>
      </header>

      <div className="space-y-3">
        {addonError && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600">
            {addonError}
          </div>
        )}
        {addonSuccess && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-600">
            {addonSuccess}
          </div>
        )}
      </div>

      <div className="space-y-3">
        {addonServicesQuery.isLoading ? (
          <p className="text-sm text-[var(--admin-muted)]">Ek hizmetler yükleniyor...</p>
        ) : services.length === 0 ? (
          <p className="text-sm text-[var(--admin-muted)]">Henüz tanımlı ek hizmet yok.</p>
        ) : (
          <div className="space-y-3">
            {services.map((service) => {
              const isEditing = editingId === service.id;
              return (
                <div
                  key={service.id}
                  className="space-y-3 rounded-2xl border bg-[var(--admin-surface-alt)] p-4 text-sm font-semibold text-[var(--admin-text-strong)] admin-border"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-base font-semibold">{service.name}</p>
                      <p className="text-xs text-[var(--admin-muted)]">
                        {service.description?.trim() || "Açıklama yok"}
                      </p>
                    </div>
                    {!isEditing && (
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-[var(--admin-surface)] px-3 py-1 text-xs font-semibold">
                          {formatPrice(service.price)}
                        </span>
                        <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-semibold">
                          <span className="text-[var(--admin-muted)]">Aktif</span>
                          <input
                            type="checkbox"
                            checked={service.isActive}
                            onChange={(event) => handleToggleActive(service, event.target.checked)}
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => startEditing(service)}
                          className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold text-[var(--admin-text-strong)] transition hover:-translate-y-0.5 hover:border-peach-200"
                        >
                          <Edit3 className="h-4 w-4" aria-hidden />
                          Düzenle
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(service)}
                          className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold text-red-500 transition hover:-translate-y-0.5 hover:border-red-200"
                        >
                          <Trash2 className="h-4 w-4" aria-hidden />
                          Sil
                        </button>
                      </div>
                    )}
                  </div>
                  {isEditing && (
                    <div className="space-y-3 rounded-2xl border bg-[var(--admin-surface)] p-4 admin-border">
                      <div className="flex items-center gap-2 rounded-2xl border bg-[var(--admin-surface-alt)] px-3 py-2 admin-border">
                        <PawPrint className="h-4 w-4 text-peach-400" aria-hidden />
                        <input
                          type="text"
                          placeholder="Hizmet adı"
                          value={editingForm.name}
                          onChange={(event) =>
                            setEditingForm((prev) => ({ ...prev, name: event.target.value }))
                          }
                          className="w-full bg-transparent text-sm font-semibold text-[var(--admin-text-strong)] placeholder:text-[var(--admin-muted)] focus:outline-none"
                        />
                      </div>
                      <textarea
                        rows={3}
                        value={editingForm.description}
                        onChange={(event) =>
                          setEditingForm((prev) => ({ ...prev, description: event.target.value }))
                        }
                        placeholder="Açıklama (opsiyonel)"
                        className="w-full rounded-2xl border bg-[var(--admin-surface-alt)] p-3 text-sm font-semibold text-[var(--admin-text-strong)] placeholder:text-[var(--admin-muted)] focus:outline-none focus:ring-2 focus:ring-peach-300 admin-border"
                      />
                      <div className="flex items-center gap-2 rounded-2xl border bg-[var(--admin-surface-alt)] px-3 py-2 admin-border">
                        <Percent className="h-4 w-4 text-peach-400" aria-hidden />
                        <input
                          type="number"
                          min={0}
                          placeholder="Fiyat"
                          value={editingForm.price}
                          onChange={(event) =>
                            setEditingForm((prev) => ({ ...prev, price: event.target.value }))
                          }
                          className="w-full bg-transparent text-sm font-semibold text-[var(--admin-text-strong)] placeholder:text-[var(--admin-muted)] focus:outline-none"
                        />
                      </div>
                      <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-semibold text-[var(--admin-text-strong)]">
                        <input
                          type="checkbox"
                          checked={editingForm.isActive}
                          onChange={(event) =>
                            setEditingForm((prev) => ({ ...prev, isActive: event.target.checked }))
                          }
                        />
                        Aktif
                      </label>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={handleSaveEdit}
                          className="inline-flex items-center gap-2 rounded-full bg-peach-400 px-4 py-2 text-xs font-semibold text-white shadow-glow transition hover:-translate-y-0.5 disabled:opacity-60"
                          disabled={updateAddonService.isPending}
                        >
                          Kaydet
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="rounded-full px-3 py-1 text-xs font-semibold text-[var(--admin-muted)] transition hover:text-peach-500"
                        >
                          Vazgeç
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="space-y-3 rounded-2xl border border-dashed border-[var(--admin-border)] bg-[var(--admin-surface-alt)] p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--admin-muted)]">
          Yeni hizmet
        </p>
        <div className="flex items-center gap-2 rounded-2xl border bg-[var(--admin-surface)] px-3 py-2 admin-border">
          <PawPrint className="h-4 w-4 text-peach-400" aria-hidden />
          <input
            type="text"
            placeholder="Hizmet adı"
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            className="w-full bg-transparent text-sm font-semibold text-[var(--admin-text-strong)] placeholder:text-[var(--admin-muted)] focus:outline-none"
          />
        </div>
        <textarea
          rows={3}
          value={form.description}
          onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
          placeholder="Açıklama (opsiyonel)"
          className="w-full rounded-2xl border bg-[var(--admin-surface)] p-3 text-sm font-semibold text-[var(--admin-text-strong)] placeholder:text-[var(--admin-muted)] focus:outline-none focus:ring-2 focus:ring-peach-300 admin-border"
        />
        <div className="flex items-center gap-2 rounded-2xl border bg-[var(--admin-surface)] px-3 py-2 admin-border">
          <Percent className="h-4 w-4 text-peach-400" aria-hidden />
          <input
            type="number"
            min={0}
            placeholder="Fiyat (₺)"
            value={form.price}
            onChange={(event) => setForm((prev) => ({ ...prev, price: event.target.value }))}
            className="w-full bg-transparent text-sm font-semibold text-[var(--admin-text-strong)] placeholder:text-[var(--admin-muted)] focus:outline-none"
          />
        </div>
        <button
          type="button"
          onClick={handleCreate}
          className="inline-flex items-center gap-2 rounded-full bg-peach-400 px-4 py-2 text-xs font-semibold text-white shadow-glow transition hover:-translate-y-0.5 disabled:opacity-60"
          disabled={createAddonService.isPending}
        >
          <PlusCircle className="h-4 w-4" aria-hidden />
          Ek hizmet ekle
        </button>
      </div>
    </section>
  );
}

function FormField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-2 text-sm font-semibold text-[var(--admin-text-strong)]">
      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--admin-muted)]">{label}</span>
      {children}
    </label>
  );
}

type TemplateModalProps = {
  channel: TemplateChannel;
  template: Template;
  onClose: () => void;
  onSave: (template: Template) => void;
};

function TemplateModal({ channel, template, onClose, onSave }: TemplateModalProps) {
  const [name, setName] = useState(template.name);
  const [subject, setSubject] = useState(template.subject ?? "");
  const [body, setBody] = useState(template.body);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSave({ ...template, name, subject: channel === "email" ? subject : undefined, body });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-3xl border bg-[var(--admin-surface)] p-6 shadow-2xl admin-border">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--admin-muted)]">{channel === "email" ? "Email Şablonu" : "SMS Şablonu"}</p>
            <h3 className="mt-1 text-2xl font-semibold text-[var(--admin-text-strong)]">{template.name}</h3>
            <p className="mt-1 text-sm text-[var(--admin-muted)]">Dinamik alanlar: {"{kedi_adı}, {musteri_adi}, {giris_tarihi}, {cikis_tarihi}, {oda_adi}"}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-[var(--admin-muted)] transition hover:bg-[var(--admin-surface-alt)] hover:text-peach-500"
            aria-label="Kapat"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <FormField label="Şablon Adı">
            <input value={name} onChange={(event) => setName(event.target.value)} className={inputClasses} />
          </FormField>
          {channel === "email" && (
            <FormField label="Konu">
              <input value={subject} onChange={(event) => setSubject(event.target.value)} className={inputClasses} />
            </FormField>
          )}
          <FormField label="Mesaj Gövdesi">
            <textarea
              rows={6}
              value={body}
              onChange={(event) => setBody(event.target.value)}
              className={`${inputClasses} rounded-3xl`}
            />
          </FormField>
          <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-[var(--admin-border)] bg-[var(--admin-surface-alt)] px-4 py-3 text-xs text-[var(--admin-muted)] sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-peach-400" aria-hidden />
              <span>Şablonlar otomatik olarak yedeklenir.</span>
            </div>
            <span className="text-[10px] uppercase tracking-[0.3em]">Light & Dark mode hazır</span>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-full px-4 py-2 text-sm font-semibold text-[var(--admin-muted)] transition hover:text-peach-500">
              Vazgeç
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-full bg-peach-400 px-5 py-2.5 text-sm font-semibold text-white shadow-glow transition hover:-translate-y-0.5"
            >
              Kaydet
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
