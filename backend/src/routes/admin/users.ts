import { Router } from 'express'
import { allowAdminRoles } from '../../middleware/allowAdminRole.js'
import { UserAdminController } from '../../controllers/admin/user.controller.js'

export const userAdminRouter = Router()
const controller = new UserAdminController()

userAdminRouter.get(
    '/',
    allowAdminRoles('owner', 'admin', 'viewer'),
    controller.getUsers,
)
userAdminRouter.get(
    '/:id',
    allowAdminRoles('owner', 'admin', 'viewer'),
    controller.getUser,
)
userAdminRouter.patch(
    '/:id/balance',
    allowAdminRoles('owner', 'admin'),
    controller.updateUserBalance,
)
userAdminRouter.patch(
    '/:id/subscription',
    allowAdminRoles('owner', 'admin'),
    controller.updateUserSubscription,
)
userAdminRouter.patch(
    '/:id/ban',
    allowAdminRoles('owner', 'admin'),
    controller.setUserBan,
)
userAdminRouter.patch(
    '/:id',
    allowAdminRoles('owner', 'admin'),
    controller.updateUser,
)
userAdminRouter.delete(
    '/:id',
    allowAdminRoles('owner', 'admin'),
    controller.deleteUser,
)
