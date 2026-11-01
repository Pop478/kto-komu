import { Router } from 'express'
import { GroupController } from '../controllers/groupController.js'

export const groupRouter = Router()
const controller = new GroupController()

groupRouter.get('/', controller.getGroups)
groupRouter.post('/', controller.createGroup)
groupRouter.get('/:groupId', controller.getGroup)
groupRouter.patch('/:groupId', controller.updateGroup)
groupRouter.delete('/:groupId', controller.deleteGroup)
groupRouter.post('/:groupId/members', controller.addMember)
groupRouter.patch(
    '/:groupId/members/:memberId/role',
    controller.updateMemberRole,
)
groupRouter.delete('/:groupId/members/:memberId', controller.removeMember)
