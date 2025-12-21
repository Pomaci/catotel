/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $CreateManagedUserDto = {
    properties: {
        email: {
            type: 'string',
            isRequired: true,
        },
        password: {
            type: 'string',
            isRequired: true,
        },
        name: {
            type: 'string',
        },
        role: {
            type: 'Enum',
            isRequired: true,
        },
    },
} as const;
