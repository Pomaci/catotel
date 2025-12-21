/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $CreatePaymentDto = {
    properties: {
        method: {
            type: 'Enum',
            isRequired: true,
        },
        amount: {
            type: 'number',
            isRequired: true,
        },
        transactionRef: {
            type: 'string',
            description: `Optional external reference or receipt code`,
        },
    },
} as const;
