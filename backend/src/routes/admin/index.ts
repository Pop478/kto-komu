import { Router } from 'express'
import { userAdminRouter } from './users.js'
import { statsAdminRouter } from './stats.js'

export const adminRoutes = Router()

adminRoutes.use('/users', userAdminRouter)
adminRoutes.use('/stats', statsAdminRouter)
