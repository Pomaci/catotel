/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $LoginDto = {
    properties: {
        email: {
            type: 'string',
            description: `User email used as the login identifier`,
            isRequired: true,
        },
        password: {
            type: 'string',
            description: `Plaintext password (min 8 characters)`,
            isRequired: true,
            minLength: 8,
        },
    },
} as const;
