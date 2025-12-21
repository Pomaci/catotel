/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $CreateRoomDto = {
    properties: {
        name: {
            type: 'string',
            isRequired: true,
        },
        roomTypeId: {
            type: 'string',
            description: `Room type id to link pricing/capacity`,
            isRequired: true,
        },
        description: {
            type: 'string',
        },
        isActive: {
            type: 'boolean',
        },
    },
} as const;
