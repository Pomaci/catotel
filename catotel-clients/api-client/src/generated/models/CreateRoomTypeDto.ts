/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type CreateRoomTypeDto = {
    name: string;
    description?: string;
    capacity: number;
    /**
     * Nightly rate for this room type
     */
    nightlyRate: number;
    /**
     * Optional overbooking allowance (number of extra rooms allowed to be sold)
     */
    overbookingLimit?: number;
    /**
     * JSON string of amenities
     */
    amenities?: Record<string, any>;
    isActive?: boolean;
};

