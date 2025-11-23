/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $CreateCatDto = {
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
    },
} as const;
