/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreateCustomerDto } from '../models/CreateCustomerDto';
import type { CreateManagedUserDto } from '../models/CreateManagedUserDto';
import type { CustomerSearchDto } from '../models/CustomerSearchDto';
import type { RegisterUserDto } from '../models/RegisterUserDto';
import type { UpdateUserRoleDto } from '../models/UpdateUserRoleDto';
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
    /**
     * List all users (admin only)
     * @returns any
     * @throws ApiError
     */
    public static userControllerListUsers(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/users',
        });
    }
    /**
     * Create a staff/manager/admin account
     * @returns any
     * @throws ApiError
     */
    public static userControllerCreateManagedUser({
        requestBody,
    }: {
        requestBody: CreateManagedUserDto,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/users/management',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Create a customer account (staff/admin)
     * @returns any
     * @throws ApiError
     */
    public static userControllerCreateCustomer({
        requestBody,
    }: {
        requestBody: CreateCustomerDto,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/users/customers',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Search customers by email/phone/name
     * @returns CustomerSearchDto
     * @throws ApiError
     */
    public static userControllerSearchCustomers(): CancelablePromise<Array<CustomerSearchDto>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/users/customers/search',
        });
    }
    /**
     * Update user role
     * @returns any
     * @throws ApiError
     */
    public static userControllerUpdateRole({
        id,
        requestBody,
    }: {
        id: string,
        requestBody: UpdateUserRoleDto,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/users/{id}/role',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
