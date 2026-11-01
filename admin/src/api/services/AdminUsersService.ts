/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { UsersListResponse } from '../models/UsersListResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AdminUsersService {
    /**
     * Get admin users
     * @param page
     * @param limit
     * @param search
     * @param isBanned
     * @param role
     * @returns UsersListResponse Users list
     * @throws ApiError
     */
    public static getAdminUsers(
        page?: number,
        limit?: number,
        search?: string,
        isBanned?: boolean,
        role?: 'user' | 'admin',
    ): CancelablePromise<UsersListResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v1/admin/users',
            query: {
                'page': page,
                'limit': limit,
                'search': search,
                'isBanned': isBanned,
                'role': role,
            },
            errors: {
                401: `Неавторизован`,
                403: `Доступ запрещён`,
                500: `Внутренняя ошибка сервера`,
            },
        });
    }
}
