/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AddonServiceDto } from '../models/AddonServiceDto';
import type { CreateAddonServiceDto } from '../models/CreateAddonServiceDto';
import type { UpdateAddonServiceDto } from '../models/UpdateAddonServiceDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AdminAddonServicesService {
    /**
     * List all addon services
     * @returns AddonServiceDto
     * @throws ApiError
     */
    public static adminAddonServicesControllerListAll(): CancelablePromise<Array<AddonServiceDto>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/admin/addon-services',
        });
    }
    /**
     * Create an addon service
     * @returns AddonServiceDto
     * @throws ApiError
     */
    public static adminAddonServicesControllerCreate({
        requestBody,
    }: {
        requestBody: CreateAddonServiceDto,
    }): CancelablePromise<AddonServiceDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/admin/addon-services',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Update an addon service
     * @returns AddonServiceDto
     * @throws ApiError
     */
    public static adminAddonServicesControllerUpdate({
        id,
        requestBody,
    }: {
        id: string,
        requestBody: UpdateAddonServiceDto,
    }): CancelablePromise<AddonServiceDto> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/admin/addon-services/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Delete an addon service
     * @returns boolean
     * @throws ApiError
     */
    public static adminAddonServicesControllerRemove({
        id,
    }: {
        id: string,
    }): CancelablePromise<boolean> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/admin/addon-services/{id}',
            path: {
                'id': id,
            },
        });
    }
}
