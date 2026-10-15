import type { Request, Response } from 'express'
import { logger } from '../../lib/logger.js'

import { UserRepository } from '../../repositories/user.repository.js'
import {
    AdminUserServiceError,
    adminUserService,
} from '../../service/admin/user.service.js'

export class UserAdminController {
    // Получение пользователей
    getUsers = async (req: Request, res: Response) => {
        try {
            const page = Number(req.query.page ?? 1)
            const limit = Number(req.query.limit ?? 20)
            const search =
                typeof req.query.search === 'string'
                    ? req.query.search
                    : undefined

            const isBanned =
                typeof req.query.isBanned === 'string'
                    ? req.query.isBanned === 'true'
                    : undefined

            const role =
                req.query.role === 'user' || req.query.role === 'admin'
                    ? req.query.role
                    : undefined

            const result = await UserRepository.getUsers({
                page,
                limit,
                search,
                isBanned,
                role,
            })

            return res.status(200).json({
                ok: true,
                ...result,
            })
        } catch (error: unknown) {
            logger.error('Failed to get users', {
                error: error instanceof Error ? error.message : 'Unknown error',
            })

            return res.status(500).json({
                ok: false,
                error: 'Failed to get users',
            })
        }
    }

    // Получение пользователя
    getUser = async (req: Request, res: Response) => {
        const { id } = req.params

        try {
            const user = await adminUserService.getUser(String(id))

            return res.status(200).json({
                ok: true,
                user,
            })
        } catch (error: unknown) {
            const message =
                error instanceof Error ? error.message : 'Failed to get user'

            logger.error('Failed to get user', {
                error: message,
                userId: req.params.id,
            })

            const statusCode =
                error instanceof AdminUserServiceError
                    ? error.statusCode
                    : message === 'User not found'
                      ? 404
                      : 400

            return res.status(statusCode).json({
                ok: false,
                error: message,
            })
        }
    }

    // Изменение пользователя
    updateUser = async (req: Request, res: Response) => {
        try {
            const user = await adminUserService.updateUser(
                String(req.params.id ?? ''),
                req.body,
            )

            return res.status(200).json({
                ok: true,
                user,
            })
        } catch (error: unknown) {
            return this.handleServiceError(res, error, 'Failed to update user')
        }
    }

    // Удаление пользователя
    updateUserBalance = async (req: Request, res: Response) => {
        try {
            const result = await adminUserService.updateUserBalance(
                String(req.params.id ?? ''),
                req.body,
            )

            return res.status(200).json({
                ok: true,
                ...result,
            })
        } catch (error: unknown) {
            return this.handleServiceError(
                res,
                error,
                'Failed to update user balance',
            )
        }
    }
    // Изменение подписки пользователя
    updateUserSubscription = async (req: Request, res: Response) => {
        try {
            const result = await adminUserService.updateUserSubscription(
                String(req.params.id ?? ''),
                req.body,
            )

            return res.status(200).json({
                ok: true,
                ...result,
            })
        } catch (error: unknown) {
            return this.handleServiceError(
                res,
                error,
                'Failed to update user subscription',
            )
        }
    }

    setUserBan = async (req: Request, res: Response) => {
        try {
            const result = await adminUserService.setUserBan(
                String(req.params.id ?? ''),
                req.body,
            )

            return res.status(200).json({
                ok: true,
                ...result,
            })
        } catch (error: unknown) {
            return this.handleServiceError(
                res,
                error,
                'Failed to update user ban',
            )
        }
    }

    deleteUser = async (req: Request, res: Response) => {
        try {
            const { id } = req.params

            const user = await UserRepository.deleteUser(String(id))

            return res.status(200).json({
                ok: true,
                user,
            })
        } catch (error: unknown) {
            const message =
                error instanceof Error ? error.message : 'Failed to delete user'

            logger.error('Failed to delete user', {
                error: message,
                userId: req.params.id,
            })

            return res.status(message === 'User not found' ? 404 : 400).json({
                ok: false,
                error: message,
            })
        }
    }

    private handleServiceError(res: Response, error: unknown, message: string) {
        const errorMessage = error instanceof Error ? error.message : message

        logger.error(message, {
            error: errorMessage,
            userId: res.req.params.id,
        })

        if (error instanceof AdminUserServiceError) {
            return res.status(error.statusCode).json({
                ok: false,
                error: error.message,
            })
        }

        return res.status(500).json({
            ok: false,
            error: message,
        })
    }
}
