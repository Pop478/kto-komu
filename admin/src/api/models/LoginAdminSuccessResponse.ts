/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type LoginAdminSuccessResponse = {
    ok: boolean;
    admin: {
        id: string;
        email: string;
        role: 'owner' | 'admin' | 'ad_manager' | 'viewer';
    };
};

