/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { LoginAdminSuccessResponse } from '../models/LoginAdminSuccessResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AuthService {
    /**
     * Авторизация в админ панель
     * @param requestBody
     * @returns LoginAdminSuccessResponse Успешная авторизация
     * @throws ApiError
     */
    public static loginAdmin(
        requestBody: {
            /**
             * Логин администратора
             */
            email: string;
            /**
             * Пароль администратора
             */
            password: string;
        },
    ): CancelablePromise<LoginAdminSuccessResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/v1/auth/admin/login',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Неверный запрос`,
                401: `Неавторизован`,
            },
        });
    }
    /**
     * Проверка админа
     * @returns LoginAdminSuccessResponse Успешная проверка
     * @throws ApiError
     */
    public static meAdmin(): CancelablePromise<LoginAdminSuccessResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v1/auth/admin/me',
            errors: {
                500: `Внутренняя ошибка сервера`,
            },
        });
    }
    /**
     * Выход
     * @returns any Успешный выход
     * @throws ApiError
     */
    public static logoutAdmin(): CancelablePromise<{
        ok: boolean;
        message: string;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/v1/auth/admin/logout',
            errors: {
                500: `Внутренняя ошибка сервера`,
            },
        });
    }
}
