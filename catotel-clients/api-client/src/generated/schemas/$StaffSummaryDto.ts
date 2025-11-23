/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $StaffSummaryDto = {
    properties: {
        id: {
            type: 'string',
            isRequired: true,
            format: 'uuid',
        },
        position: {
            type: 'dictionary',
            contains: {
                properties: {
                },
            },
        },
        phone: {
            type: 'dictionary',
            contains: {
                properties: {
                },
            },
        },
    },
} as const;
