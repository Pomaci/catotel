/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreateCatDto } from '../models/CreateCatDto';
import type { UpdateCatDto } from '../models/UpdateCatDto';
import type { UpdateCustomerDto } from '../models/UpdateCustomerDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class CustomersService {
    /**
     * @returns any
     * @throws ApiError
     */
    public static customersControllerGetMe(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/customers/me',
        });
    }
    /**
     * @returns any
     * @throws ApiError
     */
    public static customersControllerUpdateProfile({
        requestBody,
    }: {
        requestBody: UpdateCustomerDto,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/customers/me',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns any
     * @throws ApiError
     */
    public static customersControllerListCats(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/customers/cats',
        });
    }
    /**
     * @returns any
     * @throws ApiError
     */
    public static customersControllerCreateCat({
        requestBody,
    }: {
        requestBody: CreateCatDto,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/customers/cats',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns any
     * @throws ApiError
     */
    public static customersControllerUpdateCat({
        id,
        requestBody,
    }: {
        id: string,
        requestBody: UpdateCatDto,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/customers/cats/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns any
     * @throws ApiError
     */
    public static customersControllerListCatsForCustomer({
        id,
    }: {
        id: string,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/customers/{id}/cats',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns any
     * @throws ApiError
     */
    public static customersControllerCreateCatForCustomer({
        id,
        requestBody,
    }: {
        id: string,
        requestBody: CreateCatDto,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/customers/{id}/cats',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
