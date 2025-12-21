/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PricingSettingsResponseDto } from '../models/PricingSettingsResponseDto';
import type { UpdatePricingSettingsDto } from '../models/UpdatePricingSettingsDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AdminPricingSettingsService {
    /**
     * Get pricing and discount configuration
     * @returns any Pricing settings or null if not configured
     * @throws ApiError
     */
    public static pricingSettingsControllerGetSettings(): CancelablePromise<(PricingSettingsResponseDto | null)> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/admin/pricing-settings',
        });
    }
    /**
     * Create or update pricing settings
     * @returns PricingSettingsResponseDto
     * @throws ApiError
     */
    public static pricingSettingsControllerUpdateSettings({
        requestBody,
    }: {
        requestBody: UpdatePricingSettingsDto,
    }): CancelablePromise<PricingSettingsResponseDto> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/admin/pricing-settings',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
