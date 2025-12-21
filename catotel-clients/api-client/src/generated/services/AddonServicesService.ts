/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AddonServiceDto } from '../models/AddonServiceDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AddonServicesService {
    /**
     * List active addon services
     * @returns AddonServiceDto
     * @throws ApiError
     */
    public static addonServicesControllerListActive(): CancelablePromise<Array<AddonServiceDto>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/addon-services',
        });
    }
}
