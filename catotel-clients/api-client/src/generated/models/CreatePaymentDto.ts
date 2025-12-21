/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type CreatePaymentDto = {
    method: 'CASH' | 'CARD' | 'ONLINE';
    amount: number;
    /**
     * Optional external reference or receipt code
     */
    transactionRef?: string;
};

