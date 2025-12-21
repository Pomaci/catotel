/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreateRoomTypeDto } from '../models/CreateRoomTypeDto';
import type { UpdateRoomTypeDto } from '../models/UpdateRoomTypeDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class RoomTypesService {
    /**
     * @returns any
     * @throws ApiError
     */
    public static roomTypesControllerList({
        includeInactive,
        checkIn,
        checkOut,
        partySize,
    }: {
        includeInactive?: boolean,
        checkIn?: string,
        checkOut?: string,
        partySize?: number,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/room-types',
            query: {
                'includeInactive': includeInactive,
                'checkIn': checkIn,
                'checkOut': checkOut,
                'partySize': partySize,
            },
        });
    }
    /**
     * @returns any
     * @throws ApiError
     */
    public static roomTypesControllerCreate({
        requestBody,
    }: {
        requestBody: CreateRoomTypeDto,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/room-types',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns any
     * @throws ApiError
     */
    public static roomTypesControllerUpdate({
        id,
        requestBody,
    }: {
        id: string,
        requestBody: UpdateRoomTypeDto,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/room-types/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
