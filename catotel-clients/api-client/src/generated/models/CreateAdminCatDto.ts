/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type CreateAdminCatDto = {
    name: string;
    breed?: string;
    gender?: 'FEMALE' | 'MALE' | 'UNKNOWN';
    birthDate?: string;
    /**
     * Whether the cat is neutered
     */
    isNeutered?: boolean;
    /**
     * Weight in kg
     */
    weightKg?: number;
    dietaryNotes?: string;
    medicalNotes?: string;
    photoUrl?: string;
    /**
     * Customer profile ID
     */
    customerId: string;
};

