/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $CreateAdminCatDto = {
    properties: {
        name: {
            type: 'string',
            isRequired: true,
        },
        breed: {
            type: 'string',
        },
        gender: {
            type: 'Enum',
        },
        birthDate: {
            type: 'string',
        },
        isNeutered: {
            type: 'boolean',
            description: `Whether the cat is neutered`,
        },
        weightKg: {
            type: 'number',
            description: `Weight in kg`,
        },
        dietaryNotes: {
            type: 'string',
        },
        medicalNotes: {
            type: 'string',
        },
        photoUrl: {
            type: 'string',
        },
        customerId: {
            type: 'string',
            description: `Customer profile ID`,
            isRequired: true,
        },
    },
} as const;
