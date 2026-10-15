import { Request, Response, NextFunction } from 'express'
import jwt, { JwtPayload } from 'jsonwebtoken'
import { config } from '../config/config.js'
import { logger } from '../lib/logger.js'

const JWT_SECRET = config.JWT_SECRET

export interface UserJwtPayload extends JwtPayload {
    id: string
    name: string | null
    username: string | null
    telegramId: string
    first_name: string | null
    last_name: string | null
    is_premium: boolean
    languageCode: string | null
    photo_url: string | null
    role: string
}

export interface AuthUser {
    id: string
    name: string | null
    username: string | null
    telegramId: string
    first_name: string | null
    last_name: string | null
    is_premium: boolean
    languageCode: string | null
    photo_url: string | null
    role: string
}

export const jwtAuth = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    const accessToken = req.cookies.ACCESS_TOKEN

    if (!accessToken) {
        return res.status(401).json({
            error: 'Not found cookies',
        })
    }

    try {
        const payload = jwt.verify(accessToken, JWT_SECRET) as UserJwtPayload

        res.locals.userData = payload

        req.user = {
            id: payload.id,
            name: payload.name ?? null,
            username: payload.username ?? null,
            telegramId: payload.telegramId,
            first_name: payload.first_name ?? null,
            last_name: payload.last_name ?? null,
            is_premium: payload.is_premium ?? false,
            languageCode: payload.languageCode ?? null,
            photo_url: payload.photo_url ?? null,
            role: payload.role,
        }

        next()
    } catch (err: any) {
        logger.error('Auth middlewares', {
            error: err,
        })

        return res.status(401).json({
            message: 'Not found refresh Token',
            error: err.message,
        })
    }
}
