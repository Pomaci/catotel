/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AuthResponseDto } from '../models/AuthResponseDto';
import type { AuthTokensDto } from '../models/AuthTokensDto';
import type { LoginDto } from '../models/LoginDto';
import type { RefreshTokenDto } from '../models/RefreshTokenDto';
import type { SessionResponseDto } from '../models/SessionResponseDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AuthService {
    /**
     * Login with email/password
     * @returns AuthResponseDto
     * @throws ApiError
     */
    public static authControllerLogin({
        requestBody,
    }: {
        requestBody: LoginDto,
    }): CancelablePromise<AuthResponseDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/auth/login',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Rotate access/refresh tokens
     * @returns AuthTokensDto
     * @throws ApiError
     */
    public static authControllerRefresh({
        requestBody,
    }: {
        requestBody: RefreshTokenDto,
    }): CancelablePromise<AuthTokensDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/auth/refresh',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Invalidate the session that owns the given refresh token
     * @returns any
     * @throws ApiError
     */
    public static authControllerLogout({
        requestBody,
    }: {
        requestBody: RefreshTokenDto,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/auth/logout',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Logout from all devices
     * @returns any
     * @throws ApiError
     */
    public static authControllerLogoutAll(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/auth/logout-all',
        });
    }
    /**
     * List active sessions tied to the authenticated user
     * @returns SessionResponseDto
     * @throws ApiError
     */
    public static authControllerGetSessions(): CancelablePromise<Array<SessionResponseDto>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/auth/sessions',
        });
    }
    /**
     * Revoke a single active session by id
     * @returns any
     * @throws ApiError
     */
    public static authControllerRevokeSession({
        id,
    }: {
        id: string,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/auth/sessions/revoke/{id}',
            path: {
                'id': id,
            },
        });
    }
}
