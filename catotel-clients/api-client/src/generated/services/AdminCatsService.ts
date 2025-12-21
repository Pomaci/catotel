/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreateAdminCatDto } from '../models/CreateAdminCatDto';
import type { UpdateCatDto } from '../models/UpdateCatDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AdminCatsService {
    /**
     * List cats with owner info
     * @returns any
     * @throws ApiError
     */
    public static adminCatsControllerList({
        search,
        gender,
        neutered,
        page,
        pageSize,
        sortBy,
        sortDir,
    }: {
        search: string,
        gender: string,
        neutered: string,
        page: string,
        pageSize: string,
        sortBy: string,
        sortDir: string,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/admin/cats',
            query: {
                'search': search,
                'gender': gender,
                'neutered': neutered,
                'page': page,
                'pageSize': pageSize,
                'sortBy': sortBy,
                'sortDir': sortDir,
            },
        });
    }
    /**
     * Create cat for a customer
     * @returns any
     * @throws ApiError
     */
    public static adminCatsControllerCreate({
        requestBody,
    }: {
        requestBody: CreateAdminCatDto,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/admin/cats',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Get cat detail with owner info
     * @returns any
     * @throws ApiError
     */
    public static adminCatsControllerGet({
        id,
    }: {
        id: string,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/admin/cats/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Update cat
     * @returns any
     * @throws ApiError
     */
    public static adminCatsControllerUpdate({
        id,
        requestBody,
    }: {
        id: string,
        requestBody: UpdateCatDto,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/admin/cats/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
