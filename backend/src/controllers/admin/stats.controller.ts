import type { Request, Response } from 'express'
import { logger } from '../../lib/logger.js'
import { StatsAdminService } from '../../service/admin/stats.service.js'

export class StatsAdminController {
    getOverview = async (req: Request, res: Response) => {
        try {
            const data = await StatsAdminService.getOverviewStats()

            return res.status(200).json({
                ok: true,
                ...data,
            })
        } catch (error: unknown) {
            return this.handleError(res, error, 'Failed to get overview stats')
        }
    }

    getUsers = async (req: Request, res: Response) => {
        try {
            const data = await StatsAdminService.getUsersStats({
                from: req.query.from as string | undefined,
                toExclusive: req.query.to as string | undefined,
                unit: req.query.unit as 'day' | 'week' | 'month' | undefined,
                registeredFromBotId: req.query.registeredFromBotId as
                    | string
                    | undefined,
                includeBanned: req.query.includeBanned === 'true',
            })

            return res.status(200).json({
                ok: true,
                ...data,
            })
        } catch (error: unknown) {
            return this.handleError(res, error, 'Failed to get user stats')
        }
    }

    getTokens = async (req: Request, res: Response) => {
        try {
            const data = await StatsAdminService.getTokensStats()

            return res.status(200).json({
                ok: true,
                ...data,
            })
        } catch (error: unknown) {
            return this.handleError(res, error, 'Failed to get token stats')
        }
    }

    getMonetization = async (_req: Request, res: Response) => {
        try {
            const data = await StatsAdminService.getMonetizationStats()

            return res.status(200).json({
                ok: true,
                ...data,
            })
        } catch (error: unknown) {
            return this.handleError(
                res,
                error,
                'Failed to get monetization stats',
            )
        }
    }

    private handleError(res: Response, error: unknown, message: string) {
        logger.error(message, {
            error: error instanceof Error ? error.message : 'Unknown error',
        })

        return res.status(500).json({
            ok: false,
            error: message,
        })
    }
}
