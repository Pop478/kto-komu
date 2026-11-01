import type { Request, Response } from 'express'
import { logger } from '../lib/logger.js'
import { GroupService, GroupServiceError } from '../service/group/group.service.js'

export class GroupController {
    getGroups = async (req: Request, res: Response) => {
        const accountId = req.user?.id

        if (!accountId) {
            return res.status(401).json({ ok: false, error: 'UNAUTHORIZED' })
        }

        try {
            const groups = await GroupService.listGroups(accountId)

            return res.status(200).json({ ok: true, groups })
        } catch (error) {
            return this.handleError(res, error, 'Failed to get groups')
        }
    }

    getGroup = async (req: Request, res: Response) => {
        const accountId = req.user?.id
        const groupId = this.getRouteParam(req.params.groupId)

        if (!accountId) {
            return res.status(401).json({ ok: false, error: 'UNAUTHORIZED' })
        }

        if (!groupId) {
            return res.status(400).json({ ok: false, error: 'INVALID_GROUP_ID' })
        }

        try {
            const group = await GroupService.getGroup(accountId, groupId)

            return res.status(200).json({ ok: true, group })
        } catch (error) {
            return this.handleError(res, error, 'Failed to get group')
        }
    }

    createGroup = async (req: Request, res: Response) => {
        const accountId = req.user?.id

        if (!accountId) {
            return res.status(401).json({ ok: false, error: 'UNAUTHORIZED' })
        }

        try {
            const group = await GroupService.createGroup(accountId, req.body)

            return res.status(201).json({ ok: true, group })
        } catch (error) {
            return this.handleError(res, error, 'Failed to create group')
        }
    }

    updateGroup = async (req: Request, res: Response) => {
        const accountId = req.user?.id
        const groupId = this.getRouteParam(req.params.groupId)

        if (!accountId) {
            return res.status(401).json({ ok: false, error: 'UNAUTHORIZED' })
        }

        if (!groupId) {
            return res.status(400).json({ ok: false, error: 'INVALID_GROUP_ID' })
        }

        try {
            const group = await GroupService.updateGroup(
                accountId,
                groupId,
                req.body,
            )

            return res.status(200).json({ ok: true, group })
        } catch (error) {
            return this.handleError(res, error, 'Failed to update group')
        }
    }

    deleteGroup = async (req: Request, res: Response) => {
        const accountId = req.user?.id
        const groupId = this.getRouteParam(req.params.groupId)

        if (!accountId) {
            return res.status(401).json({ ok: false, error: 'UNAUTHORIZED' })
        }

        if (!groupId) {
            return res.status(400).json({ ok: false, error: 'INVALID_GROUP_ID' })
        }

        try {
            await GroupService.deleteGroup(accountId, groupId)

            return res.status(204).send()
        } catch (error) {
            return this.handleError(res, error, 'Failed to delete group')
        }
    }

    addMember = async (req: Request, res: Response) => {
        const accountId = req.user?.id
        const groupId = this.getRouteParam(req.params.groupId)

        if (!accountId) {
            return res.status(401).json({ ok: false, error: 'UNAUTHORIZED' })
        }

        if (!groupId) {
            return res.status(400).json({ ok: false, error: 'INVALID_GROUP_ID' })
        }

        try {
            const member = await GroupService.addMember(
                accountId,
                groupId,
                req.body,
            )

            return res.status(201).json({ ok: true, member })
        } catch (error) {
            return this.handleError(res, error, 'Failed to add group member')
        }
    }

    updateMemberRole = async (req: Request, res: Response) => {
        const accountId = req.user?.id
        const groupId = this.getRouteParam(req.params.groupId)
        const memberId = this.getRouteParam(req.params.memberId)

        if (!accountId) {
            return res.status(401).json({ ok: false, error: 'UNAUTHORIZED' })
        }

        if (!groupId || !memberId) {
            return res.status(400).json({
                ok: false,
                error: 'INVALID_GROUP_MEMBER_ID',
            })
        }

        try {
            const member = await GroupService.updateMemberRole(
                accountId,
                groupId,
                memberId,
                req.body,
            )

            return res.status(200).json({ ok: true, member })
        } catch (error) {
            return this.handleError(res, error, 'Failed to update group member')
        }
    }

    removeMember = async (req: Request, res: Response) => {
        const accountId = req.user?.id
        const groupId = this.getRouteParam(req.params.groupId)
        const memberId = this.getRouteParam(req.params.memberId)

        if (!accountId) {
            return res.status(401).json({ ok: false, error: 'UNAUTHORIZED' })
        }

        if (!groupId || !memberId) {
            return res.status(400).json({
                ok: false,
                error: 'INVALID_GROUP_MEMBER_ID',
            })
        }

        try {
            await GroupService.removeMember(accountId, groupId, memberId)

            return res.status(204).send()
        } catch (error) {
            return this.handleError(res, error, 'Failed to remove group member')
        }
    }

    private getRouteParam(value: string | string[] | undefined) {
        return typeof value === 'string' && value ? value : undefined
    }

    private handleError(res: Response, error: unknown, message: string) {
        if (error instanceof GroupServiceError) {
            return res.status(error.statusCode).json({
                ok: false,
                error: error.message,
            })
        }

        logger.error(message, {
            error: error instanceof Error ? error.message : 'Unknown error',
        })

        return res.status(500).json({
            ok: false,
            error: 'INTERNAL_SERVER_ERROR',
        })
    }
}
