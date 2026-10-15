import { AuthAdmin } from '../middleware/adminAuthMiddleware.ts'
import { AuthUser } from '../middleware/authMiddleware.ts'

declare global {
    namespace Express {
        interface Request {
            user?: AuthUser
            admin?: AuthAdmin
        }
    }
}

export {}
