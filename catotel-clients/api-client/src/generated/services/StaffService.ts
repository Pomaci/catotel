/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { UpdateTaskStatusDto } from '../models/UpdateTaskStatusDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class StaffService {
    /**
     * @returns any
     * @throws ApiError
     */
    public static staffControllerListTasks(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/staff/tasks',
        });
    }
    /**
     * @returns any
     * @throws ApiError
     */
    public static staffControllerUpdateStatus({
        id,
        requestBody,
    }: {
        id: string,
        requestBody: UpdateTaskStatusDto,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/staff/tasks/{id}/status',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
