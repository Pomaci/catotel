/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AdminCustomersService {
    /**
     * List customers with pagination and filters
     * @returns any
     * @throws ApiError
     */
    public static adminCustomersControllerList({
        search,
        status,
        page,
        pageSize,
        sortBy,
        sortDir,
    }: {
        search: string,
        status: string,
        page: string,
        pageSize: string,
        sortBy: string,
        sortDir: string,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/admin/customers',
            query: {
                'search': search,
                'status': status,
                'page': page,
                'pageSize': pageSize,
                'sortBy': sortBy,
                'sortDir': sortDir,
            },
        });
    }
    /**
     * Delete a customer and related data
     * @returns any
     * @throws ApiError
     */
    public static adminCustomersControllerDelete({
        id,
    }: {
        id: string,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/admin/customers/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Get customer detail
     * @returns any
     * @throws ApiError
     */
    public static adminCustomersControllerGet({
        id,
    }: {
        id: string,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/admin/customers/{id}',
            path: {
                'id': id,
            },
        });
    }
}
