/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { RegisterUserDto } from '../models/RegisterUserDto';
import type { UserProfileDto } from '../models/UserProfileDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class UsersService {
    /**
     * Register a new Catotel account
     * @returns UserProfileDto
     * @throws ApiError
     */
    public static userControllerRegister({
        requestBody,
    }: {
        requestBody: RegisterUserDto,
    }): CancelablePromise<UserProfileDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/users/register',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Return the authenticated user profile
     * @returns UserProfileDto
     * @throws ApiError
     */
    public static userControllerGetMe(): CancelablePromise<UserProfileDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/users/me',
        });
    }
}
