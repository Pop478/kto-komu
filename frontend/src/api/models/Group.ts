/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AccountPreview } from './AccountPreview';
import type { GroupMember } from './GroupMember';
export type Group = {
    id: string;
    name: string;
    createdAt: string;
    members: Array<(GroupMember & {
        account: (AccountPreview | null);
    })>;
};

