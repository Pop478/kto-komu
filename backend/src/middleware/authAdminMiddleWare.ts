import { Request, Response, NextFunction } from 'express'
import jwt, { JwtPayload } from 'jsonwebtoken'
import { config } from '../config/config.js'
import { logger } from '../lib/logger.js'
import { AdminRole } from '../generated/prisma/enums.js'

export interface AuthAdmin {
    id: string
    role: AdminRole
    email: string
}

export type AdminJwtPayload = AuthAdmin & JwtPayload

export const jwtAuthAdmin = (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    const accessToken = req.cookies?.ADMIN_ACCESS_TOKEN

    if (!accessToken) {
        return res.status(401).json({
            error: 'Unauthorized',
            message: 'Access token not found',
        })
    }

    try {
        const payload = jwt.verify(
            accessToken,
            config.ADMIN_JWT_SECRET,
        ) as AdminJwtPayload

        res.locals.userData = payload

        req.admin = {
            id: payload.id,
            role: payload.role,
            email: payload.email,
        }

        next()
    } catch (err: any) {
        logger.error('JWT auth middleware', { error: err })

        return res.status(401).json({
            error: 'Unauthorized',
            message: 'Invalid or expired token',
        })
    }
}
