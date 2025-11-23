/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $SessionResponseDto = {
    properties: {
        id: {
            type: 'string',
            isRequired: true,
            format: 'uuid',
        },
        userAgent: {
            type: 'string',
            description: `Browser or device user agent`,
            isRequired: true,
        },
        ip: {
            type: 'string',
            description: `Reported IP address`,
            isRequired: true,
        },
        isRevoked: {
            type: 'boolean',
            isRequired: true,
        },
        createdAt: {
            type: 'string',
            isRequired: true,
            format: 'date-time',
        },
        updatedAt: {
            type: 'string',
            isRequired: true,
            format: 'date-time',
        },
        lastUsedAt: {
            type: 'string',
            isRequired: true,
            format: 'date-time',
        },
        expiresAt: {
            type: 'string',
            isRequired: true,
            format: 'date-time',
        },
    },
} as const;
