/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AdminUserListItem } from './AdminUserListItem';
export type UsersListResponse = {
    ok: boolean;
    users: Array<AdminUserListItem>;
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
};

