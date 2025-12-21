/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $UpdateRoomTypeDto = {
    properties: {
        name: {
            type: 'string',
        },
        description: {
            type: 'string',
        },
        capacity: {
            type: 'number',
        },
        nightlyRate: {
            type: 'number',
            description: `Nightly rate for this room type`,
        },
        overbookingLimit: {
            type: 'number',
            description: `Optional overbooking allowance (number of extra rooms allowed to be sold)`,
        },
        amenities: {
            type: 'dictionary',
            contains: {
                properties: {
                },
            },
        },
        isActive: {
            type: 'boolean',
        },
    },
} as const;
