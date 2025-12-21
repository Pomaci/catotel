import { formatHotelDay } from "@/lib/utils/hotel-day";
import type { PricingSettingsResponse } from "@/lib/api/admin";
import type { RoomType } from "@/types/hotel";

import {
  defaultPricingSettings,
  PRICING_SETTINGS_STORAGE_KEY,
  type NormalizedPricingSettings,
  type PricingBreakdown,
  type WizardPricingContext,
} from "./types";

export function readPricingSettingsCache(): PricingSettingsResponse | null {
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

export function writePricingSettingsCache(payload: PricingSettingsResponse) {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(PRICING_SETTINGS_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // ignore storage quota issues
  }
}

export function isPricingSettingsNotFound(error: unknown) {
  return error instanceof Error && /404/.test(error.message);
}

export function normalizePricingSettings(payload?: PricingSettingsResponse | null): NormalizedPricingSettings {
  if (!payload) {
    return defaultPricingSettings;
  }

  const normalizeTiers = <T>(incoming: T[] | undefined, fallback: T[]) => {
    if (!incoming || incoming.length === 0) {
      return fallback;
    }
    return incoming;
  };

  const multiCat = normalizeTiers(payload.multiCatDiscounts, defaultPricingSettings.multiCatDiscounts);
  let sharedRoom = normalizeTiers(payload.sharedRoomDiscounts, defaultPricingSettings.sharedRoomDiscounts);
  if ((!sharedRoom || sharedRoom.length === 0) && typeof payload.sharedRoomDiscountPercent === "number") {
    sharedRoom = [{ remainingCapacity: 1, discountPercent: payload.sharedRoomDiscountPercent }];
  }
  const longStay = (() => {
    if (payload.longStayDiscounts && payload.longStayDiscounts.length > 0) {
      return payload.longStayDiscounts;
    }
    if (payload.longStayDiscount) {
      const { minNights, discountPercent } = payload.longStayDiscount;
      return [{ minNights, discountPercent }];
    }
    return defaultPricingSettings.longStayDiscounts;
  })();

  return {
    multiCatDiscountEnabled:
      payload.multiCatDiscountEnabled ?? defaultPricingSettings.multiCatDiscountEnabled,
    multiCatDiscounts: [...multiCat].sort((a, b) => a.catCount - b.catCount),
    sharedRoomDiscountEnabled:
      payload.sharedRoomDiscountEnabled ?? defaultPricingSettings.sharedRoomDiscountEnabled,
    sharedRoomDiscounts: [...sharedRoom].sort((a, b) => a.remainingCapacity - b.remainingCapacity),
    longStayDiscountEnabled:
      payload.longStayDiscountEnabled ??
      payload.longStayDiscount?.enabled ??
      defaultPricingSettings.longStayDiscountEnabled,
    longStayDiscounts: [...longStay].sort((a, b) => a.minNights - b.minNights),
  };
}

export function calculatePricingBreakdown(context: WizardPricingContext): PricingBreakdown | null {
  const { room, nights, catCount, allowRoomSharing, settings, addons } = context;
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

  const discounts: PricingBreakdown["discounts"] = [];
  const addonLines: PricingBreakdown["addons"] = [];

  if (addons?.length) {
    addons.forEach((entry) => {
      const unitPrice = parseAmount(entry.service.price);
      if (entry.quantity <= 0 || unitPrice <= 0) return;
      const quantity = Math.max(1, entry.quantity);
      addonLines.push({
        serviceId: entry.service.id,
        name: entry.service.name,
        quantity,
        unitPrice,
        total: unitPrice * quantity,
      });
    });
  }

  if (settings.multiCatDiscountEnabled && settings.multiCatDiscounts.length > 0) {
    const tier = settings.multiCatDiscounts
      .slice()
      .reverse()
      .find((entry) => catCount >= entry.catCount);
    if (tier && tier.discountPercent > 0) {
      const percent = tier.discountPercent;
      discounts.push({
        key: "multiCat",
        label: `Çok kedili indirim (${percent}%)`,
        percent,
        amount: (baseTotal * percent) / 100,
        description: `${tier.catCount}+ kedi`,
      });
    }
  }

  if (
    allowRoomSharing &&
    settings.sharedRoomDiscountEnabled &&
    settings.sharedRoomDiscounts.length > 0
  ) {
    const remainingCapacity = Math.max(capacity - catCount, 0);
    const tier = settings.sharedRoomDiscounts
      .slice()
      .reverse()
      .find((entry) => remainingCapacity >= entry.remainingCapacity);
    if (tier && tier.discountPercent > 0) {
      const percent = tier.discountPercent;
      discounts.push({
        key: "sharedRoom",
        label: `Paylaşım indirimi (${percent}%)`,
        percent,
        amount: (baseTotal * percent) / 100,
        description: `${tier.remainingCapacity}+ boş slot`,
      });
    }
  }

  if (settings.longStayDiscountEnabled && settings.longStayDiscounts.length > 0) {
    const tier = settings.longStayDiscounts
      .slice()
      .reverse()
      .find((entry) => nights >= entry.minNights);
    if (tier && tier.discountPercent > 0) {
      const percent = tier.discountPercent;
      discounts.push({
        key: "longStay",
        label: `Uzun konaklama (${percent}%)`,
        percent,
        amount: (baseTotal * percent) / 100,
        description: `${tier.minNights}+ gece`,
      });
    }
  }

  const totalDiscount = discounts.reduce((sum, entry) => sum + entry.amount, 0);
  const addonsTotal = addonLines.reduce((sum, entry) => sum + entry.total, 0);

  return {
    nightlyRate,
    slotCount,
    nights,
    baseTotal,
    discounts,
    addons: addonLines,
    addonsTotal,
    total: Math.max(0, baseTotal - totalDiscount + addonsTotal),
    remainingCapacity: allowRoomSharing ? Math.max(capacity - catCount, 0) : 0,
    allowRoomSharing,
  };
}

export function roomHasCapacityForSelection(
  room: RoomType,
  allowRoomSharing: boolean,
  requestedCats: number,
) {
  const capacity = Math.max(room.capacity ?? requestedCats, 1);
  if (allowRoomSharing) {
    const availableSlots =
      typeof room.availableSlots === "number" ? room.availableSlots : (room.availableUnits ?? 0) * capacity;
    return availableSlots >= requestedCats;
  }
  const availableUnits =
    typeof room.availableUnits === "number" ? room.availableUnits : room.availableSlots ?? capacity;
  return availableUnits > 0;
}

export function parseAmount(value: number | string | null | undefined) {
  if (value === undefined || value === null) {
    return 0;
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }
  const normalized = Number(String(value).replace(",", "."));
  return Number.isFinite(normalized) ? normalized : 0;
}

export function formatCurrency(value: number) {
  const safeValue = Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 0,
  }).format(safeValue);
}

export function formatDiscountLabel(discount: number) {
  return discount > 0 ? `-${discount}%` : "—";
}

export function compactDate(value: string) {
  return formatHotelDay(value, { day: "2-digit", month: "short" });
}
