/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreateReservationDto } from '../models/CreateReservationDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ReservationsService {
    /**
     * @returns any
     * @throws ApiError
     */
    public static reservationsControllerList({
        status,
    }: {
        status?: 'PENDING' | 'CONFIRMED' | 'CHECKED_IN' | 'CHECKED_OUT' | 'CANCELLED',
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/reservations',
            query: {
                'status': status,
            },
        });
    }
    /**
     * @returns any
     * @throws ApiError
     */
    public static reservationsControllerCreate({
        requestBody,
    }: {
        requestBody: CreateReservationDto,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/reservations',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns any
     * @throws ApiError
     */
    public static reservationsControllerGetById({
        id,
    }: {
        id: string,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/reservations/{id}',
            path: {
                'id': id,
            },
        });
    }
}
