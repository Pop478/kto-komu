import crypto from 'node:crypto'
// import jwt from 'jsonwebtoken'
import type { Request, Response } from 'express'
import { cookiesOptions } from '../config/cookies.js'
// import { logger } from '../lib/logger.js'
// import { AdminAuthService } from '../service/auth/adminAuth.service.js'
// import { AdminJwtPayload } from '../middleware/authAdminMiddleWare.js'
// import { config } from '../config/config.js'
import { authService } from '../service/auth/auth.service.js'
import { logger } from '../lib/logger.js'

const ACCESS_TOKEN_COOKIE = 'ACCESS_TOKEN'
const REFRESH_TOKEN_COOKIE = 'REFRESH_TOKEN'

export class AuthController {
    // // Создание ссылки для Google
    // getGoogleAuthUrl = (req: Request, res: Response) => {
    //     const { url, state, nonce } = authService.createGoogleAuthUrl()

    //     res.cookie('GOOGLE_OAUTH_STATE', state, {
    //         httpOnly: true,
    //         secure: true,
    //         sameSite: 'lax',
    //         maxAge: 10 * 60 * 1000,
    //     })

    //     res.cookie('GOOGLE_OAUTH_NONCE', nonce, {
    //         httpOnly: true,
    //         secure: true,
    //         sameSite: 'lax',
    //         maxAge: 10 * 60 * 1000,
    //     })

    //     return res.redirect(302, url)
    // }

    // // Google OpenID Connect
    // authGoogle = async (req: Request, res: Response) => {
    //     try {
    //         const { code, state } = req.body

    //         if (!code || !state) {
    //             return res.status(400).json({
    //                 ok: false,
    //                 error: 'GOOGLE_AUTH_DATA_REQUIRED',
    //             })
    //         }

    //         const savedState = req.cookies?.GOOGLE_OAUTH_STATE
    //         const savedNonce = req.cookies?.GOOGLE_OAUTH_NONCE

    //         if (!savedState || !savedNonce || savedState !== state) {
    //             return res.status(401).json({
    //                 ok: false,
    //                 error: 'INVALID_GOOGLE_STATE',
    //             })
    //         }

    //         const payload = await authService.authGoogle({
    //             code,
    //             nonce: savedNonce,
    //         })

    //         if (payload.banned) {
    //             return res.status(403).json({
    //                 ok: false,
    //                 banned: true,
    //                 error: 'USER_BANNED',
    //             })
    //         }

    //         res.clearCookie('GOOGLE_OAUTH_STATE')
    //         res.clearCookie('GOOGLE_OAUTH_NONCE')

    //         res.cookie('ACCESS_TOKEN', payload.accessToken, cookiesOptions)

    //         return res.status(200).json({
    //             ok: true,
    //             user: payload.user,
    //             isNewUser: payload.isNewUser,
    //         })
    //     } catch (error) {
    //         logger.error('Google auth failed', {
    //             error: error instanceof Error ? error.message : 'Unknown error',
    //         })

    //         return res.status(401).json({
    //             ok: false,
    //             error: 'GOOGLE_AUTH_FAILED',
    //         })
    //     }
    // }

    // Создание ссылки для Yandex
    getYandexAuthUrl = (req: Request, res: Response) => {
        const { url, state, codeVerifier } = authService.createYandexAuthUrl()

        // state в cookies пользвователя
        res.cookie('YANDEX_OAUTH_STATE', state, cookiesOptions)
        // codeVerifier в cookies пользвователя
        res.cookie('YANDEX_OAUTH_CODE_VERIFIER', codeVerifier, cookiesOptions)

        return res.redirect(302, url)
    }

    // Yandex callback open Id client
    authYandex = async (req: Request, res: Response) => {
        try {
            const code =
                typeof req.query.code === 'string' ? req.query.code : undefined
            const state =
                typeof req.query.state === 'string'
                    ? req.query.state
                    : undefined

            if (!code || !state) {
                return res.status(400).json({
                    ok: false,
                    error: 'YANDEX_AUTH_DATA_REQUIRED',
                })
            }

            const savedState = req.cookies?.YANDEX_OAUTH_STATE
            const codeVerifier = req.cookies?.YANDEX_OAUTH_CODE_VERIFIER

            const isStateValid =
                !!savedState &&
                savedState.length === state.length &&
                crypto.timingSafeEqual(
                    Buffer.from(savedState),
                    Buffer.from(state),
                )

            if (!isStateValid || !codeVerifier) {
                return res.status(401).json({
                    ok: false,
                    error: 'INVALID_YANDEX_STATE',
                })
            }

            const payload = await authService.authYandex({
                code,
                codeVerifier,
            })

            if (payload.banned) {
                return res.status(403).json({
                    ok: false,
                    banned: true,
                    error: 'USER_BANNED',
                })
            }

            res.clearCookie('YANDEX_OAUTH_STATE', {
                httpOnly: true,
                secure: true,
                sameSite: 'lax',
            })
            res.clearCookie('YANDEX_OAUTH_CODE_VERIFIER', {
                httpOnly: true,
                secure: true,
                sameSite: 'lax',
            })

            res.cookie('ACCESS_TOKEN', payload.accessToken, cookiesOptions)

            return res.status(200).json({
                ok: true,
                user: payload.user,
                isNewUser: payload.isNewUser,
            })
        } catch (error) {
            logger.error('Yandex auth failed', {
                error: error instanceof Error ? error.message : 'Unknown error',
            })

            return res.status(401).json({
                ok: false,
                error: 'YANDEX_AUTH_FAILED',
            })
        }
    }

    // Email Register
    // registerByEmail = async (req: Request, res: Response) => {
    //     const ip = req.ip

    //     try {
    //         const { email, password, name, refCode, adLink, turnstileToken } =
    //             req.body

    //         if (!email || !password) {
    //             return res.status(400).json({
    //                 ok: false,
    //                 error: 'EMAIL_AND_PASSWORD_REQUIRED',
    //             })
    //         }
    //         if (typeof turnstileToken !== 'string' || !turnstileToken.trim()) {
    //             return res.status(400).json({
    //                 ok: false,
    //                 error: 'CAPTCHA_REQUIRED',
    //             })
    //         }

    //         const payload = await authService.registerByEmail({
    //             email,
    //             password,
    //             name,
    //             refCode,
    //             adLink,
    //             turnstileToken,
    //             remoteIp: ip,
    //         })

    //         return res.status(201).json({
    //             ok: true,
    //             message: payload.message,
    //         })
    //     } catch (error) {
    //         logger.error('Email register failed', {
    //             error: error instanceof Error ? error.message : 'Unknown error',
    //         })

    //         const message =
    //             error instanceof Error ? error.message : 'EMAIL_REGISTER_FAILED'

    //         const statusMap: Record<string, number> = {
    //             EMAIL_ALREADY_REGISTERED: 409,

    //             INVALID_EMAIL: 400,
    //             PASSWORD_TOO_SHORT: 400,
    //             EMAIL_AND_PASSWORD_REQUIRED: 400,

    //             CAPTCHA_REQUIRED: 400,
    //             CAPTCHA_INVALID: 400,
    //             CAPTCHA_HOSTNAME_INVALID: 400,
    //             CAPTCHA_ACTION_INVALID: 400,

    //             CAPTCHA_SERVICE_UNAVAILABLE: 503,
    //             CAPTCHA_CONFIGURATION_ERROR: 500,
    //         }

    //         return res.status(statusMap[message] ?? 500).json({
    //             ok: false,
    //             error: message,
    //         })
    //     }
    // }
    // // Verify Email
    // verifyEmail = async (req: Request, res: Response) => {
    //     try {
    //         const token = String(req.query.token || '')

    //         if (!token) {
    //             return res.redirect(
    //                 `${config.URL}/login/email-verified?status=invalid`,
    //             )
    //         }

    //         await authService.verifyEmail(token)

    //         return res.redirect(
    //             `${config.URL}/login/email-verified?status=success`,
    //         )
    //     } catch (error) {
    //         logger.error('Email verification failed', {
    //             error: error instanceof Error ? error.message : 'Unknown error',
    //         })

    //         const message =
    //             error instanceof Error ? error.message : 'EMAIL_VERIFY_FAILED'

    //         const status =
    //             message === 'INVALID_TOKEN' || message === 'TOKEN_EXPIRED'
    //                 ? message.toLowerCase()
    //                 : 'failed'

    //         return res.redirect(
    //             `${config.URL}/login/email-verified?status=${status}`,
    //         )
    //     }
    // }

    // // Resend Email Verification
    // resendVerificationEmail = async (req: Request, res: Response) => {
    //     const ip = req.ip

    //     try {
    //         const { email, turnstileToken } = req.body

    //         if (!email) {
    //             return res.status(400).json({
    //                 ok: false,
    //                 error: 'EMAIL_REQUIRED',
    //             })
    //         }

    //         await authService.resendVerificationEmail({
    //             email,
    //             turnstileToken,
    //             remoteIp: ip,
    //         })

    //         return res.status(200).json({
    //             ok: true,
    //             message: 'IF_EMAIL_EXISTS_WE_SENT_CODE',
    //         })
    //     } catch (error) {
    //         logger.error('Resend email verification failed', {
    //             error: error instanceof Error ? error.message : 'Unknown error',
    //         })

    //         const message =
    //             error instanceof Error
    //                 ? error.message
    //                 : 'RESEND_EMAIL_VERIFICATION_FAILED'

    //         if (message === 'INVALID_EMAIL') {
    //             return res.status(400).json({
    //                 ok: false,
    //                 error: 'INVALID_EMAIL',
    //             })
    //         }

    //         if (message === 'CAPTCHA_FAILED') {
    //             return res.status(400).json({
    //                 ok: false,
    //                 error: 'CAPTCHA_FAILED',
    //             })
    //         }

    //         if (message === 'EMAIL_VERIFICATION_RATE_LIMITED') {
    //             return res.status(429).json({
    //                 ok: false,
    //                 error: 'EMAIL_VERIFICATION_RATE_LIMITED',
    //             })
    //         }

    //         return res.status(200).json({
    //             ok: true,
    //             message: 'IF_EMAIL_EXISTS_WE_SENT_CODE',
    //         })
    //     }
    // }

    // // Email Login
    // loginByEmail = async (req: Request, res: Response) => {
    //     try {
    //         const { email, password } = req.body

    //         if (!email || !password) {
    //             return res.status(400).json({
    //                 ok: false,
    //                 error: 'EMAIL_AND_PASSWORD_REQUIRED',
    //             })
    //         }

    //         const payload = await authService.loginByEmail({
    //             email,
    //             password,
    //         })

    //         if (payload.banned) {
    //             return res.status(403).json({
    //                 ok: false,
    //                 banned: true,
    //                 error: 'USER_BANNED',
    //             })
    //         }

    //         res.cookie('ACCESS_TOKEN', payload.accessToken, cookiesOptions)

    //         return res.status(200).json({
    //             ok: true,
    //             user: payload.user,
    //         })
    //     } catch (error) {
    //         logger.error('Email login failed', {
    //             error: error instanceof Error ? error.message : 'Unknown error',
    //         })

    //         const message =
    //             error instanceof Error
    //                 ? error.message
    //                 : 'INVALID_EMAIL_OR_PASSWORD'

    //         if (message === 'EMAIL_NOT_VERIFIED') {
    //             return res.status(403).json({
    //                 ok: false,
    //                 error: 'EMAIL_NOT_VERIFIED',
    //                 canResend: true,
    //             })
    //         }

    //         return res.status(401).json({
    //             ok: false,
    //             error: 'INVALID_EMAIL_OR_PASSWORD',
    //         })
    //     }
    // }

    // // Forgot Password
    // forgotPassword = async (req: Request, res: Response) => {
    //     const ip = req.ip

    //     try {
    //         const { email, turnstileToken } = req.body

    //         if (!email) {
    //             return res.status(400).json({
    //                 ok: false,
    //                 error: 'EMAIL_REQUIRED',
    //             })
    //         }

    //         if (typeof turnstileToken !== 'string' || !turnstileToken.trim()) {
    //             return res.status(400).json({
    //                 ok: false,
    //                 error: 'CAPTCHA_REQUIRED',
    //             })
    //         }

    //         await authService.forgotPassword({
    //             email,
    //             turnstileToken,
    //             remoteIp: ip,
    //         })

    //         return res.status(200).json({
    //             ok: true,
    //             message: 'PASSWORD_RESET_EMAIL_SENT',
    //         })
    //     } catch (error) {
    //         logger.error('Forgot password failed', {
    //             error: error instanceof Error ? error.message : 'Unknown error',
    //         })

    //         return res.status(200).json({
    //             ok: true,
    //             message: 'PASSWORD_RESET_EMAIL_SENT',
    //         })
    //     }
    // }

    // // Reset Password
    // resetPassword = async (req: Request, res: Response) => {
    //     try {
    //         const { token, password } = req.body

    //         if (!token || !password) {
    //             return res.status(400).json({
    //                 ok: false,
    //                 error: 'TOKEN_AND_PASSWORD_REQUIRED',
    //             })
    //         }

    //         await authService.resetPassword({
    //             token,
    //             password,
    //         })

    //         return res.status(200).json({
    //             ok: true,
    //             message: 'PASSWORD_RESET_SUCCESS',
    //         })
    //     } catch (error) {
    //         logger.error('Reset password failed', {
    //             error: error instanceof Error ? error.message : 'Unknown error',
    //         })

    //         const message =
    //             error instanceof Error ? error.message : 'PASSWORD_RESET_FAILED'

    //         const status =
    //             message === 'INVALID_TOKEN' ||
    //             message === 'TOKEN_EXPIRED' ||
    //             message === 'PASSWORD_TOO_SHORT'
    //                 ? 400
    //                 : 500

    //         return res.status(status).json({
    //             ok: false,
    //             error: message,
    //         })
    //     }
    // }

    // Данные пользователя
    meUser = async (req: Request, res: Response) => {
        try {
            const token = req.cookies?.[ACCESS_TOKEN_COOKIE]

            if (!token) {
                return res.status(401).json({
                    ok: false,
                    error: 'UNAUTHORIZED',
                })
            }

            const user = await authService.meUser(token)

            return res.status(200).json({
                ok: true,
                user,
            })
        } catch {
            res.clearCookie(ACCESS_TOKEN_COOKIE, cookiesOptions)
            res.clearCookie(REFRESH_TOKEN_COOKIE, cookiesOptions)

            return res.status(401).json({
                ok: false,
                error: 'UNAUTHORIZED',
            })
        }
    }
    // Выход
    logoutUser = async (_req: Request, res: Response) => {
        res.clearCookie('ACCESS_TOKEN', cookiesOptions)

        return res.status(200).json({
            ok: true,
        })
    }

    // // Вход в админку
    // async authAdmin(req: Request, res: Response) {
    //     try {
    //         const { email, password } = req.body

    //         if (!email || !password) {
    //             return res.status(400).json({
    //                 ok: false,
    //                 error: 'Email and password required',
    //             })
    //         }

    //         const payload = await AdminAuthService.login(email, password)

    //         res.cookie(
    //             'ADMIN_ACCESS_TOKEN',
    //             payload.accessToken,
    //             cookiesOptions,
    //         )

    //         return res.status(200).json({
    //             ok: true,
    //             id: payload.admin.id,
    //             email: payload.admin.email,
    //             role: payload.admin.role,
    //         })
    //     } catch (error: unknown) {
    //         logger.error('Admin auth failed', {
    //             error: error instanceof Error ? error.message : 'Unknown error',
    //         })

    //         return res.status(401).json({
    //             ok: false,
    //             error: 'Invalid email or password',
    //         })
    //     }
    // }
    // // Проверка при входе в админку
    // async meAdmin(req: Request, res: Response) {
    //     try {
    //         const accessToken = req.cookies.ADMIN_ACCESS_TOKEN

    //         if (!accessToken) {
    //             return res.status(401).json({
    //                 ok: false,
    //                 error: 'Unauthorized',
    //             })
    //         }

    //         const admin = jwt.verify(
    //             accessToken,
    //             config.ADMIN_JWT_SECRET,
    //         ) as AdminJwtPayload

    //         if (!admin) {
    //             return res.status(401).json({
    //                 ok: false,
    //                 error: 'Unauthorized',
    //             })
    //         }

    //         return res.json({
    //             ok: true,
    //             admin: {
    //                 id: admin.id,
    //                 email: admin.email,
    //                 role: admin.role,
    //             },
    //         })
    //     } catch (error) {
    //         return res.status(401).json({
    //             ok: false,
    //             error: 'Unauthorized',
    //         })
    //     }
    // }
    // // Выход из аккауната admin
    // async logoutAdmin(req: Request, res: Response) {
    //     try {
    //         res.clearCookie('ADMIN_ACCESS_TOKEN', cookiesOptions)
    //         res.clearCookie('ADMIN_REFRESH_TOKEN', cookiesOptions)
    //         return res.json({
    //             ok: true,
    //             message: 'Logout successful',
    //         })
    //     } catch (error: unknown) {
    //         logger.error('Admin logout failed', {
    //             error: error instanceof Error ? error.message : 'Unknown error',
    //         })

    //         return res.status(500).json({
    //             ok: false,
    //             error: 'Failed to logout',
    //         })
    //     }
    // }

    // private clearAuthCookies = (res: Response) => {
    //     res.clearCookie(ACCESS_TOKEN_COOKIE, cookiesOptions)
    //     res.clearCookie(REFRESH_TOKEN_COOKIE, cookiesOptions)
    // }
}
