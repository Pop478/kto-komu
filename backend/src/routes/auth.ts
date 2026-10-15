import { Router } from 'express'
import { AuthController } from '../controllers/authController.js'

export const authRouter = Router()
const controller = new AuthController()

// Telegram Mini App
authRouter.post('/telegram-mini-app', controller.authTelegramMiniApp)

// Telegram Login Widget
authRouter.post('/telegram-login', controller.authTelegramLogin)

// Google OpenID Connect
authRouter.get('/google/url', controller.getGoogleAuthUrl)
authRouter.post('/google/callback', controller.authGoogle)

// Email + Password
authRouter.post('/email/login', controller.loginByEmail)
authRouter.post('/email/register', controller.registerByEmail)
authRouter.get('/email/verify-email', controller.verifyEmail)
authRouter.post('/email/resend-email', controller.resendVerificationEmail)
authRouter.post('/email/forgot-password', controller.forgotPassword)
authRouter.post('/email/reset-password', controller.resetPassword)

// Текущий пользователь
authRouter.get('/me', controller.meUser)
authRouter.post('/logout', controller.logoutUser)

// Admin
authRouter.post('/admin/login', controller.authAdmin)
authRouter.get('/admin/me', controller.meAdmin)
authRouter.post('/admin/logout', controller.logoutAdmin)
