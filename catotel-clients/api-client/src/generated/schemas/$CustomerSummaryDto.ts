/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $CustomerSummaryDto = {
    properties: {
        id: {
            type: 'string',
            isRequired: true,
            format: 'uuid',
        },
        phone: {
            type: 'dictionary',
            contains: {
                properties: {
                },
            },
        },
        address: {
            type: 'dictionary',
            contains: {
                properties: {
                },
            },
        },
    },
} as const;
