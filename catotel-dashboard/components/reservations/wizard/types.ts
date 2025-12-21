import type { PricingSettingsResponse } from "@/lib/api/admin";
import type { AddonService, RoomType } from "@/types/hotel";

export type StepKey = "customer" | "cats" | "dates" | "pricing";
export const stepOrder: StepKey[] = ["customer", "cats", "dates", "pricing"];

export type ReservationAddonInput = {
  serviceId: string;
  quantity: number;
};

export type ReservationWizardValues = {
  roomTypeId: string | null;
  catIds: string[];
  checkIn: string;
  checkOut: string;
  specialRequests?: string;
  customerId?: string | null;
  allowRoomSharing?: boolean;
  addons?: ReservationAddonInput[];
};

export type NormalizedPricingSettings = {
  multiCatDiscountEnabled: boolean;
  multiCatDiscounts: Array<{ catCount: number; discountPercent: number }>;
  sharedRoomDiscountEnabled: boolean;
  sharedRoomDiscounts: Array<{ remainingCapacity: number; discountPercent: number }>;
  longStayDiscountEnabled: boolean;
  longStayDiscounts: Array<{ minNights: number; discountPercent: number }>;
};

export type PricingDiscountLine = {
  key: "multiCat" | "sharedRoom" | "longStay";
  label: string;
  percent: number;
  amount: number;
  description: string;
};

export type PricingAddonLine = {
  serviceId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
};

export type PricingBreakdown = {
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

export const PRICING_SETTINGS_STORAGE_KEY = "catotel-pricing-settings";

export const defaultPricingSettings: NormalizedPricingSettings = {
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

export type WizardPricingContext = {
  room: RoomType | null;
  nights: number | null;
  catCount: number;
  allowRoomSharing: boolean;
  settings: NormalizedPricingSettings;
  addons?: Array<{ service: AddonService; quantity: number }>;
};

export type PricingSettingsCache = PricingSettingsResponse | null;
