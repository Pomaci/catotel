/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { LegacyLongStayDiscountDto } from './LegacyLongStayDiscountDto';
import type { LongStayDiscountTierDto } from './LongStayDiscountTierDto';
import type { MultiCatDiscountTierDto } from './MultiCatDiscountTierDto';
import type { SharedRoomDiscountTierDto } from './SharedRoomDiscountTierDto';
export type PricingSettingsResponseDto = {
    multiCatDiscountEnabled?: boolean;
    multiCatDiscounts?: Array<MultiCatDiscountTierDto>;
    sharedRoomDiscountEnabled?: boolean;
    sharedRoomDiscountPercent?: number;
    sharedRoomDiscounts?: Array<SharedRoomDiscountTierDto>;
    longStayDiscountEnabled?: boolean;
    longStayDiscounts?: Array<LongStayDiscountTierDto>;
    longStayDiscount?: LegacyLongStayDiscountDto;
};

