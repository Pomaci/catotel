/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $UpdatePricingSettingsDto = {
    properties: {
        multiCatDiscountEnabled: {
            type: 'boolean',
        },
        multiCatDiscounts: {
            type: 'array',
            contains: {
                type: 'MultiCatDiscountTierDto',
            },
        },
        sharedRoomDiscountEnabled: {
            type: 'boolean',
        },
        sharedRoomDiscountPercent: {
            type: 'dictionary',
            contains: {
                properties: {
                },
            },
        },
        sharedRoomDiscounts: {
            type: 'array',
            contains: {
                type: 'SharedRoomDiscountTierDto',
            },
        },
        longStayDiscountEnabled: {
            type: 'boolean',
        },
        longStayDiscounts: {
            type: 'array',
            contains: {
                type: 'LongStayDiscountTierDto',
            },
        },
        longStayDiscount: {
            type: 'LegacyLongStayDiscountDto',
        },
    },
} as const;
