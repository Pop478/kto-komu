/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { OAuthProvider } from './OAuthProvider';
export type AuthUser = {
    id: string;
    username?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    gender?: 'MALE' | 'FEMALE' | 'OTHER';
    birthDate?: string | null;
    photoUrl?: string | null;
    email?: string | null;
    emailVerifiedAt?: string | null;
    languageCode?: string | null;
    theme: 'LIGHT' | 'DARK' | 'SYSTEM';
    status: 'GUEST' | 'REGISTERED';
    termsAccepted: boolean;
    createdAt: string;
    /**
     * OAuth identities linked to this account.
     */
    providers: Array<OAuthProvider>;
};

