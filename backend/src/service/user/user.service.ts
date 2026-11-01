import {
    CreateUserDTO,
    UpdateUserDTO,
    UserRepository,
} from '../../repositories/user.repository.js'

const REFERRAL_REWARD_AMOUNT = 50

export interface CreateUserWithProviderDTO {
    provider: AuthProvider
    providerUserId: string
    telegramId?: bigint | null
    email?: string | null
    emailVerified?: boolean
    username: string | null
    first_name: string | null
    last_name: string | null
    is_premium: boolean
    languageCode: string | null
    photo_url: string | null
    passwordHash?: string | null
    refCode?: string
    telegramBotId?: string
}

export class UserService {
    static async createUser(data: CreateUserDTO) {
        return TransactionRepository.run(async (tx) => {
            const user = await UserRepository.create(data, tx)
            await UserProfileRepository.create(
                {
                    userId: user.id,
                    name: user.first_name,
                },
                tx,
            ) // Создание профиля
            await UserBalanceRepository.create(user.id, 0, tx) // Создание баланса
            await BalanceService.creditBalance(
                // вознаграждение за регистрацию
                {
                    userId: user.id,
                    amount: 40,
                    type: UserBalanceTransactionType.registration,
                    entityType: 'User',
                    entityId: user.id,
                    description: 'Registration bonus',
                    metadata: {
                        reason: 'registration_bonus',
                    },
                },
                tx,
            )
            await userDailyRewardRepository.create(user.id, tx) // Создание ежедневного вознаграждения

            if (data.refCode && data.refCode !== user.id) {
                const referrer = await UserRepository.findById(data.refCode, tx)

                if (referrer) {
                    const referral = await ReferralRepository.create(
                        {
                            referredId: user.id,
                            referrerId: referrer.id,
                        },
                        tx,
                    )

                    await BalanceService.creditBalance(
                        {
                            userId: referrer.id,
                            amount: REFERRAL_REWARD_AMOUNT,
                            type: UserBalanceTransactionType.referral_reward,
                            entityType: 'Referral',
                            entityId: referral.id,
                            description: 'Referral reward',
                            metadata: {
                                referredId: user.id,
                                rewardAmount: REFERRAL_REWARD_AMOUNT,
                            },
                        },
                        tx,
                    )
                }
            }

            return user
        })
    }

    static async createUserWithProvider(data: CreateUserWithProviderDTO) {
        return TransactionRepository.run(async (tx) => {
            const user = await UserRepository.create(
                {
                    telegramId: data.telegramId,
                    // email: data.email,
                    username: data.username,
                    first_name: data.first_name,
                    last_name: data.last_name,
                    is_premium: data.is_premium,
                    languageCode: data.languageCode,
                    photo_url: data.photo_url,
                    refCode: data.refCode,
                    telegramBotId: data.telegramBotId,
                },
                tx,
            )

            await UserAuthProviderRepository.create(
                {
                    userId: user.id,
                    provider: data.provider,
                    providerUserId: data.providerUserId,
                    email: data.email,
                    emailVerified: data.emailVerified ?? false,
                    passwordHash: data.passwordHash,
                },
                tx,
            )

            await UserProfileRepository.create(
                {
                    userId: user.id,
                    name: user.first_name,
                },
                tx,
            )

            await UserBalanceRepository.create(user.id, 0, tx)

            await BalanceService.creditBalance(
                {
                    userId: user.id,
                    amount: 40,
                    type: UserBalanceTransactionType.registration,
                    entityType: 'User',
                    entityId: user.id,
                    description: 'Registration bonus',
                    metadata: {
                        reason: 'registration_bonus',
                    },
                },
                tx,
            )

            await userDailyRewardRepository.create(user.id, tx)

            if (data.refCode && data.refCode !== user.id) {
                const referrer = await UserRepository.findById(data.refCode, tx)

                if (referrer) {
                    const referral = await ReferralRepository.create(
                        {
                            referredId: user.id,
                            referrerId: referrer.id,
                        },
                        tx,
                    )

                    await BalanceService.creditBalance(
                        {
                            userId: referrer.id,
                            amount: REFERRAL_REWARD_AMOUNT,
                            type: UserBalanceTransactionType.referral_reward,
                            entityType: 'Referral',
                            entityId: referral.id,
                            description: 'Referral reward',
                            metadata: {
                                referredId: user.id,
                                rewardAmount: REFERRAL_REWARD_AMOUNT,
                            },
                        },
                        tx,
                    )
                }
            }

            return user
        })
    }

    static async updateUserData(data: UpdateUserDTO) {
        return UserRepository.updateTelegramData(data)
    }

    static async findByTelegramId(telegramId: bigint) {
        return UserRepository.findByTelegramId(telegramId)
    }
    static async findById(userId: string) {
        return UserRepository.findById(userId)
    }

    static async setTelegramUserBan(telegramId: bigint, ban: boolean) {
        const user = await UserRepository.findByTelegramId(telegramId)

        if (!user) {
            throw new Error('User not found')
        }

        return UserRepository.updateUser(user.id, { ban })
    }

    static async syncTelegramUser(data: CreateUserDTO) {
        const existing = await UserRepository.findByTelegramId(data.telegramId)

        if (existing) {
            return this.updateUserData({
                id: existing.id,
                username: data.username,
                first_name: data.first_name,
                last_name: data.last_name,
                is_premium: data.is_premium,
                languageCode: data.languageCode,
                photo_url: data.photo_url,
            })
        }

        return this.createUser(data)
    }

    static async findAllBotUsers() {
        return await UserRepository.findAllBotUsers()
    }
}
