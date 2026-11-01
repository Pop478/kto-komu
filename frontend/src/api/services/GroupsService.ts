/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { GroupAddMemberRequest } from '../models/GroupAddMemberRequest';
import type { GroupCreateRequest } from '../models/GroupCreateRequest';
import type { GroupListResponse } from '../models/GroupListResponse';
import type { GroupMemberResponse } from '../models/GroupMemberResponse';
import type { GroupResponse } from '../models/GroupResponse';
import type { GroupSummaryResponse } from '../models/GroupSummaryResponse';
import type { GroupUpdateMemberRoleRequest } from '../models/GroupUpdateMemberRoleRequest';
import type { GroupUpdateRequest } from '../models/GroupUpdateRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class GroupsService {
    /**
     * List groups of the current account
     * @returns GroupListResponse Groups where the current account is a member.
     * @throws ApiError
     */
    public static listGroups(): CancelablePromise<GroupListResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v1/group',
            errors: {
                401: `Неавторизован`,
            },
        });
    }
    /**
     * Create a group
     * @param requestBody
     * @returns GroupResponse Group created. The current account is added as OWNER.
     * @throws ApiError
     */
    public static createGroup(
        requestBody: GroupCreateRequest,
    ): CancelablePromise<GroupResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/v1/group',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Неверный запрос`,
                401: `Неавторизован`,
                403: `Доступ запрещён`,
                404: `Сущность не найдена`,
            },
        });
    }
    /**
     * Get a group with members
     * @param groupId
     * @returns GroupResponse Group and its members.
     * @throws ApiError
     */
    public static getGroup(
        groupId: string,
    ): CancelablePromise<GroupResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v1/group/{groupId}',
            path: {
                'groupId': groupId,
            },
            errors: {
                401: `Неавторизован`,
                403: `Доступ запрещён`,
                404: `Сущность не найдена`,
            },
        });
    }
    /**
     * Rename a group
     * @param groupId
     * @param requestBody
     * @returns GroupSummaryResponse Group updated by its owner or admin.
     * @throws ApiError
     */
    public static updateGroup(
        groupId: string,
        requestBody: GroupUpdateRequest,
    ): CancelablePromise<GroupSummaryResponse> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/v1/group/{groupId}',
            path: {
                'groupId': groupId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Неверный запрос`,
                401: `Неавторизован`,
                403: `Доступ запрещён`,
            },
        });
    }
    /**
     * Delete a group
     * @param groupId
     * @returns void
     * @throws ApiError
     */
    public static deleteGroup(
        groupId: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/v1/group/{groupId}',
            path: {
                'groupId': groupId,
            },
            errors: {
                401: `Неавторизован`,
                403: `Доступ запрещён`,
            },
        });
    }
    /**
     * Add an account to a group
     * @param groupId
     * @param requestBody
     * @returns GroupMemberResponse Account added as MEMBER by the group owner or admin.
     * @throws ApiError
     */
    public static addGroupMember(
        groupId: string,
        requestBody: GroupAddMemberRequest,
    ): CancelablePromise<GroupMemberResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/v1/group/{groupId}/members',
            path: {
                'groupId': groupId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Неверный запрос`,
                401: `Неавторизован`,
                403: `Доступ запрещён`,
                404: `Сущность не найдена`,
                409: `Конфликт данных`,
            },
        });
    }
    /**
     * Change a group member role
     * @param groupId
     * @param memberId
     * @param requestBody
     * @returns GroupMemberResponse Role updated by the group owner. OWNER cannot be assigned through this endpoint.
     * @throws ApiError
     */
    public static updateGroupMemberRole(
        groupId: string,
        memberId: string,
        requestBody: GroupUpdateMemberRoleRequest,
    ): CancelablePromise<GroupMemberResponse> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/v1/group/{groupId}/members/{memberId}/role',
            path: {
                'groupId': groupId,
                'memberId': memberId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Неверный запрос`,
                401: `Неавторизован`,
                403: `Доступ запрещён`,
                404: `Сущность не найдена`,
                409: `Конфликт данных`,
            },
        });
    }
    /**
     * Remove a member from a group
     * @param groupId
     * @param memberId
     * @returns void
     * @throws ApiError
     */
    public static removeGroupMember(
        groupId: string,
        memberId: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/v1/group/{groupId}/members/{memberId}',
            path: {
                'groupId': groupId,
                'memberId': memberId,
            },
            errors: {
                401: `Неавторизован`,
                403: `Доступ запрещён`,
                404: `Сущность не найдена`,
                409: `Конфликт данных`,
            },
        });
    }
}
