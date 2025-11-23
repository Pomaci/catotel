/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $UpdateRoomDto = {
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
            description: `Nightly rate in USD`,
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
