import { Router } from 'express'
import { allowAdminRoles } from '../../middleware/allowAdminRole.js'
import { StatsAdminController } from '../../controllers/admin/stats.controller.js'

export const statsAdminRouter = Router()
const controller = new StatsAdminController()

statsAdminRouter.get(
    '/users',
    allowAdminRoles('owner', 'admin', 'viewer'),
    controller.getUsers,
)
statsAdminRouter.get(
    '/tokens',
    allowAdminRoles('owner', 'admin', 'viewer'),
    controller.getTokens,
)
statsAdminRouter.get(
    '/overview',
    allowAdminRoles('owner', 'admin', 'viewer'),
    controller.getOverview,
)
statsAdminRouter.get(
    '/monetization',
    allowAdminRoles('owner', 'admin', 'viewer'),
    controller.getMonetization,
)
