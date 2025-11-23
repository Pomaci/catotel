/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $RegisterUserDto = {
    properties: {
        email: {
            type: 'string',
            isRequired: true,
        },
        password: {
            type: 'string',
            isRequired: true,
            minLength: 8,
        },
        name: {
            type: 'string',
            description: `Optional display name to show in dashboards`,
            isNullable: true,
        },
    },
} as const;
