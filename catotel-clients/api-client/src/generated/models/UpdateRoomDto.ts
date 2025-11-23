/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type UpdateRoomDto = {
    name?: string;
    description?: string;
    capacity?: number;
    /**
     * Nightly rate in USD
     */
    nightlyRate?: number;
    /**
     * JSON string of amenities
     */
    amenities?: Record<string, any>;
    isActive?: boolean;
};

