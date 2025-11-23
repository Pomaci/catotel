/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CustomerSummaryDto } from './CustomerSummaryDto';
import type { StaffSummaryDto } from './StaffSummaryDto';
export type UserProfileDto = {
    id: string;
    email: string;
    name?: Record<string, any> | null;
    role: 'ADMIN' | 'MANAGER' | 'STAFF' | 'CUSTOMER';
    customer?: CustomerSummaryDto;
    staff?: StaffSummaryDto;
};

