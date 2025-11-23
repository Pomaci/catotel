/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $AuthResponseDto = {
    properties: {
        access_token: {
            type: 'string',
            description: `Short-lived access token (JWT)`,
            isRequired: true,
        },
        refresh_token: {
            type: 'string',
            description: `Refresh token that rotates on each refresh call`,
            isRequired: true,
        },
        user: {
            type: 'AuthUserDto',
            isRequired: true,
        },
    },
} as const;
