import type { Request, Response } from 'express'
import { logger } from '../lib/logger.js'
import { UserRepository } from '../repositories/user.repository.js'
import { characterRepository } from '../repositories/character.repository.js'
import { scenarioRepository } from '../repositories/scenario.repository.js'

export class UserController {
    // Получение публичного профиля пользователя
    async getUser(req: Request, res: Response) {
        const { userId } = req.params

        if (!userId || Array.isArray(userId)) {
            return res.status(400).json({
                ok: false,
                error: 'Invalid userId',
            })
        }

        try {
            const [user, characters, scenarios] = await Promise.all([
                UserRepository.findById(userId),
                characterRepository.findManyByUserId({
                    userId,
                    isPrivate: false,
                }),
                scenarioRepository.findManyByUserId({
                    userId,
                    isPrivate: false,
                }),
            ])

            if (!user) {
                return res.status(404).json({
                    ok: false,
                    error: 'User not found',
                })
            }

            return res.status(200).json({
                ok: true,
                user: {
                    id: user.id,
                    firstName: user.first_name,
                    photoUrl: user.photo_url,
                    profileBackgroundUrl:
                        user.settings?.profileBackgroundUrl ?? null,
                    createdAt: user.createdAt,
                },
                characters: characters.map((character) => ({
                    id: character.id,
                    name: character.name,
                    description: character.description,
                    gender: character.gender,
                    age: character.age,
                    photoUrl: character.photoUrl,
                    chatsCount: character.chatsCount,
                })),
                scenarios: scenarios.map((scenario) => ({
                    id: scenario.id,
                    name: scenario.name,
                    description: scenario.description,
                    greetingMessage: scenario.greetingMessage,
                    photoUrl: scenario.photoUrl,
                    tags: scenario.tags,
                })),
            })
        } catch (error: unknown) {
            logger.error('Failed to get user profile', {
                error: error instanceof Error ? error.message : 'Unknown error',
            })

            return res.status(500).json({
                ok: false,
                error: 'Failed to get user profile',
            })
        }
    }

    // Подтверждение пользовательского соглашения
    async acceptTerms(req: Request, res: Response) {
        const userId = req.user?.id

        try {
            const existingUser = await UserRepository.findById(userId)

            if (!existingUser) {
                return res.status(404).json({
                    ok: false,
                    error: 'User not found',
                })
            }

            if (existingUser.termsAccepted) {
                return res.status(200).json({
                    ok: true,
                    user: {
                        id: existingUser.id,
                        termsAccepted: existingUser.termsAccepted,
                    },
                })
            }

            const user = await UserRepository.acceptTerms(userId)

            return res.status(200).json({
                ok: true,
                user: {
                    id: user.id,
                    termsAccepted: user.termsAccepted,
                    updatedAt: user.updatedAt,
                },
            })
        } catch (error: unknown) {
            logger.error('Failed to accept terms', {
                error: error instanceof Error ? error.message : 'Unknown error',
            })

            return res.status(500).json({
                ok: false,
                error: 'Failed to accept terms',
            })
        }
    }
}
