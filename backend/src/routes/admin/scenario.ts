import { Router } from 'express'
import { allowAdminRoles } from '../../middleware/allowAdminRole.js'
import { ScenarioAdminController } from '../../controllers/admin/scenario.controller.js'
import { uploadImage } from '../../middleware/uploadPhoto.js'

export const scenarioAdminRouter = Router()
const controller = new ScenarioAdminController()

scenarioAdminRouter.get(
    '/',
    allowAdminRoles('owner', 'admin', 'viewer'),
    controller.getScenarios,
)
scenarioAdminRouter.get(
    '/:id',
    allowAdminRoles('owner', 'admin', 'viewer'),
    controller.getScenario,
)
scenarioAdminRouter.post(
    '/',
    allowAdminRoles('owner', 'admin'),
    uploadImage.single('photo'),
    controller.createScenario,
)
scenarioAdminRouter.patch(
    '/:id',
    allowAdminRoles('owner', 'admin'),
    uploadImage.single('photo'),
    controller.updateScenario,
)
scenarioAdminRouter.delete(
    '/:id',
    allowAdminRoles('owner', 'admin'),
    controller.deleteScenario,
)
