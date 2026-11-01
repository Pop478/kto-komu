import { Router } from 'express'
import { AuthController } from '../controllers/authController.js'

export const authRouter = Router()
const controller = new AuthController()

// Yandex OAuth
authRouter.get('/yandex/url', controller.getYandexAuthUrl)
authRouter.get('/yandex/callback', controller.authYandex)

// // VK ID OAuth
// authRouter.post('/vk/callback', controller.authVk)

// // Email + Password
// authRouter.post('/email/login', controller.loginByEmail)
// authRouter.post('/email/register', controller.registerByEmail)
// authRouter.get('/email/verify-email', controller.verifyEmail)
// authRouter.post('/email/resend-email', controller.resendVerificationEmail)
// authRouter.post('/email/forgot-password', controller.forgotPassword)
// authRouter.post('/email/reset-password', controller.resetPassword)

// Текущий пользователь
authRouter.get('/me', controller.meUser)
authRouter.post('/logout', controller.logoutUser)

// // Admin
// authRouter.post('/admin/login', controller.authAdmin)
// authRouter.get('/admin/me', controller.meAdmin)
// authRouter.post('/admin/logout', controller.logoutAdmin)
