/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type AdminUserBase = {
    id: string;
    telegramId: string | null;
    username: string | null;
    first_name: string | null;
    last_name: string | null;
    is_premium: boolean;
    languageCode: string | null;
    photo_url: string | null;
    role: 'user' | 'manager' | 'admin';
    theme: 'light' | 'dark' | 'system';
    ban: boolean;
    isBanned: boolean;
    is_active: boolean;
    createdAt: string;
    updatedAt: string;
};

