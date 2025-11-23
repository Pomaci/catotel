/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $CreateRoomDto = {
    properties: {
        name: {
            type: 'string',
            isRequired: true,
        },
        description: {
            type: 'string',
        },
        capacity: {
            type: 'number',
            isRequired: true,
        },
        nightlyRate: {
            type: 'number',
            description: `Nightly rate in USD`,
            isRequired: true,
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
