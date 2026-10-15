import type { Request, Response, NextFunction } from 'express'
import { AdminRole } from '../generated/prisma/enums.js'

export function allowAdminRoles(...roles: AdminRole[]) {
    return (req: Request, res: Response, next: NextFunction) => {
        const admin = req.admin
        if (!admin) {
            return res
                .status(401)
                .json({ success: false, error: 'Unauthorized' })
        }

        if (!roles.includes(admin.role)) {
            return res.status(403).json({
                success: false,
                error: 'Forbidden: insufficient permissions',
            })
        }

        next()
    }
}
