import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { jwtAuth } from '../middleware/authMiddleware.js'
import { authRouter } from './auth.js'
import { userRouter } from './user.js'
import { groupRouter } from './group.js'
// import { adminRoutes } from './admin/index.js'
// import { jwtAuthAdmin } from '../middleware/authAdminMiddleWare.js'
// import { redisRouter } from './redis.js'

export const routes = Router()

routes.use('/auth', authRouter)
// routes.use('/users', jwtAuth, userRouter)
routes.use('/group', jwtAuth, groupRouter)
// routes.use('/users', jwtAuth, userRouter)

// ADMIN
// routes.use('/admin', jwtAuthAdmin, adminRoutes)

// REDIS
// routes.use('/redis', redisRouter)

// health-check
routes.get('/health', async (_, res) => {
    try {
        // Проверим подключение к БД
        await prisma.$queryRaw`SELECT 1`

        return res.status(200).json({
            status: 'ok',
            services: {
                database: 'connected',
            },
            timestamp: new Date().toISOString(),
        })
    } catch (e) {
        return res.status(500).json({
            status: 'error',
            message: 'Database not reachable',
            timestamp: new Date().toISOString(),
        })
    }
})
