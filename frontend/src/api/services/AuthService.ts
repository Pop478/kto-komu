/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AuthSuccessResponse } from '../models/AuthSuccessResponse';
import type { LogoutSuccessResponse } from '../models/LogoutSuccessResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AuthService {
    /**
     * Start Yandex OAuth authorization
     * @returns void
     * @throws ApiError
     */
    public static yandexAuthRedirect(): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v1/auth/yandex/url',
            errors: {
                302: `Redirect to the Yandex authorization page. The response sets short-lived PKCE and state cookies.`,
                500: `Внутренняя ошибка сервера`,
            },
        });
    }
    /**
     * Complete Yandex OAuth authorization
     * @param code Single-use authorization code returned by Yandex.
     * @param state CSRF protection value returned by Yandex.
     * @returns AuthSuccessResponse Successful authorization. The response sets the ACCESS_TOKEN HttpOnly cookie.
     * @throws ApiError
     */
    public static authYandexCallback(
        code: string,
        state: string,
    ): CancelablePromise<AuthSuccessResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v1/auth/yandex/callback',
            query: {
                'code': code,
                'state': state,
            },
            errors: {
                400: `Неверный запрос`,
                401: `Неавторизован`,
            },
        });
    }
    /**
     * Get the current authenticated account
     * @returns AuthSuccessResponse Current account and its registered OAuth providers.
     * @throws ApiError
     */
    public static meUser(): CancelablePromise<AuthSuccessResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v1/auth/me',
            errors: {
                401: `Неавторизован`,
            },
        });
    }
    /**
     * Log out the current account
     * @returns LogoutSuccessResponse Successful logout. The ACCESS_TOKEN cookie is cleared.
     * @throws ApiError
     */
    public static logoutUser(): CancelablePromise<LogoutSuccessResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/v1/auth/logout',
        });
    }
}
