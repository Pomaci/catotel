/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreateRoomDto } from '../models/CreateRoomDto';
import type { UpdateRoomDto } from '../models/UpdateRoomDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class RoomsService {
    /**
     * @returns any
     * @throws ApiError
     */
    public static roomsControllerList({
        includeInactive,
    }: {
        includeInactive?: boolean,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/rooms',
            query: {
                'includeInactive': includeInactive,
            },
        });
    }
    /**
     * @returns any
     * @throws ApiError
     */
    public static roomsControllerCreate({
        requestBody,
    }: {
        requestBody: CreateRoomDto,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/rooms',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns any
     * @throws ApiError
     */
    public static roomsControllerUpdate({
        id,
        requestBody,
    }: {
        id: string,
        requestBody: UpdateRoomDto,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/rooms/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
