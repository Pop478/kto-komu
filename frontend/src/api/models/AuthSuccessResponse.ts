/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AuthUser } from './AuthUser';
export type AuthSuccessResponse = {
    ok: boolean;
    user: AuthUser;
    /**
     * Present after an OAuth callback; true when a new account was created.
     */
    isNewUser?: boolean;
};

