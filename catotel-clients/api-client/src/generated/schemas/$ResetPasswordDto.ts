/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $ResetPasswordDto = {
    properties: {
        token: {
            type: 'string',
            description: `Raw token from the reset email`,
            isRequired: true,
        },
        password: {
            type: 'string',
            description: `New password`,
            isRequired: true,
            minLength: 8,
        },
    },
} as const;
