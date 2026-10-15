import { Router } from 'express'
import { UserController } from '../controllers/userController.js'

export const userRouter = Router()
const controller = new UserController()

userRouter.post('/me/terms', controller.acceptTerms) // согласие с пользовательским соглашением
userRouter.get('/:userId', controller.getUser)
