/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AuthUserDto } from './AuthUserDto';
export type AuthResponseDto = {
    /**
     * Short-lived access token (JWT)
     */
    access_token: string;
    /**
     * Refresh token that rotates on each refresh call
     */
    refresh_token: string;
    user: AuthUserDto;
};

