import {
    SubscriptionStatus,
    SubscriptionTier,
    UserBalanceTransactionDirection,
    UserBalanceTransactionType,
    UserRole,
    UserTheme,
} from '../../generated/prisma/client.js'
import { UserBalancePaymentRepository } from '../../repositories/balance/userBalancePayment.repository.js'
import { characterRepository } from '../../repositories/character.repository.js'
import { chatRepository } from '../../repositories/chat.repository.js'
import { ReferralRepository } from '../../repositories/referral.repository.js'
import { scenarioRepository } from '../../repositories/scenario.repository.js'
import { UserPromoCodeRepository } from '../../repositories/promoCode/userPromoCode.repository.js'
import { UserRepository } from '../../repositories/user.repository.js'
// import { UserTaskRepository } from '../../repositories/task/userTask.repository.js'
import { UserCharacterReactionRepository } from '../../repositories/userCharaterReaction.repository.js'
import { userDailyRewardRepository } from '../../repositories/dailyReward/userDailyReward.repository.js'
import { BalanceService } from '../balance/balance.service.js'
import { UserSubscriptionRepository } from '../../repositories/subscription/userSubscription.repository.js'
import { TransactionRepository } from '../../repositories/transaction.repository.js'

class AdminUserServiceError extends Error {
    constructor(
        message: string,
        public statusCode = 400,
    ) {
        super(message)
    }
}

const RECENT_LIMIT = 20

type UpdateUserBalancePayload = {
    amount?: unknown
    direction?: unknown
    description?: unknown
}

type UpdateUserSubscriptionPayload = {
    action?: unknown
    subscriptionId?: unknown
    tier?: unknown
    status?: unknown
    startsAt?: unknown
    expiresAt?: unknown
    durationDays?: unknown
}

type SetUserBanPayload = {
    isBanned?: unknown
    ban?: unknown
}

type UpdateUserPayload = {
    username?: unknown
    first_name?: unknown
    last_name?: unknown
    languageCode?: unknown
    photo_url?: unknown
    is_premium?: unknown
    role?: unknown
    theme?: unknown
    isBanned?: unknown
    ban?: unknown
    is_active?: unknown
}

const mapUser = (
    user: NonNullable<Awaited<ReturnType<typeof UserRepository.findById>>>,
) => ({
    id: user.id,
    telegramId: user.telegramId?.toString() ?? null,
    username: user.username,
    first_name: user.first_name,
    last_name: user.last_name,
    is_premium: user.is_premium,
    languageCode: user.languageCode,
    photo_url: user.photo_url,
    role: user.role,
    theme: user.theme,
    ban: user.ban,
    isBanned: user.ban,
    is_active: user.is_active,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
})

const mapSubscription = (
    subscription: NonNullable<
        Awaited<ReturnType<typeof UserSubscriptionRepository.create>>
    >,
) => ({
    id: subscription.id,
    userId: subscription.userId,
    tier: subscription.tier,
    status: subscription.status,
    startsAt: subscription.startsAt,
    expiresAt: subscription.expiresAt,
    createdAt: subscription.createdAt,
    updatedAt: subscription.updatedAt,
})

const mapCharacter = (
    character: Awaited<
        ReturnType<typeof characterRepository.findManyByUserId>
    >[number],
) => ({
    id: character.id,
    universeId: character.universeId,
    userId: character.userId,
    source: character.source,
    name: character.name,
    photoUrl: character.photoUrl,
    description: character.description,
    gender: character.gender,
    age: character.age,
    systemPrompt: character.systemPrompt,
    chatsCount: character.chatsCount,
    isActive: character.isActive,
    createdAt: character.createdAt,
    updatedAt: character.updatedAt,
    universe: character.universe
        ? {
              id: character.universe.id,
              name: character.universe.name,
              imageUrl: character.universe.imageUrl,
          }
        : null,
})

const mapScenario = (
    scenario: Awaited<
        ReturnType<typeof scenarioRepository.findManyByUserId>
    >[number],
) => ({
    id: scenario.id,
    characterId: scenario.characterId,
    userId: scenario.userId,
    source: scenario.source,
    name: scenario.name,
    photoUrl: scenario.photoUrl,
    description: scenario.description,
    tags: scenario.tags,
    systemPrompt: scenario.systemPrompt,
    greetingMessage: scenario.greetingMessage,
    model: scenario.model,
    provider: scenario.provider,
    temperature: scenario.temperature,
    topP: scenario.topP,
    maxTokens: scenario.maxTokens,
    presencePenalty: scenario.presencePenalty,
    frequencyPenalty: scenario.frequencyPenalty,
    settings: scenario.settings,
    isActive: scenario.isActive,
    createdAt: scenario.createdAt,
    updatedAt: scenario.updatedAt,
    character: scenario.character
        ? {
              id: scenario.character.id,
              name: scenario.character.name,
              photoUrl: scenario.character.photoUrl,
          }
        : null,
})

const mapChat = (
    chat: Awaited<ReturnType<typeof chatRepository.findMany>>[number],
) => ({
    id: chat.id,
    userId: chat.userId,
    characterId: chat.characterId,
    scenarioId: chat.scenarioId,
    title: chat.title,
    status: chat.status,
    characterSnapshot: chat.characterSnapshot,
    scenarioSnapshot: chat.scenarioSnapshot,
    lastMessageAt: chat.lastMessageAt,
    deletedAt: chat.deletedAt,
    createdAt: chat.createdAt,
    updatedAt: chat.updatedAt,
    messagesCount: chat._count.messages,
    attachmentsCount: chat._count.attachments,
    character: chat.character,
    scenario: chat.scenario,
})

const mapReferral = (
    referral: Awaited<
        ReturnType<typeof ReferralRepository.findManyByReferrerId>
    >[number],
) => ({
    id: referral.id,
    referrerId: referral.referrerId,
    referredId: referral.referredId,
    earnedUsd: referral.earnedUsd.toString(),
    percent: referral.percent.toString(),
    createdAt: referral.createdAt,
})

const normalizePositiveInteger = (
    value: unknown,
    fieldName: string,
): number => {
    const number = Number(value)

    if (!Number.isInteger(number) || number <= 0) {
        throw new AdminUserServiceError(
            `${fieldName} must be a positive integer`,
            400,
        )
    }

    return number
}

const normalizeBalanceDirection = (
    value: unknown,
): UserBalanceTransactionDirection => {
    if (value === UserBalanceTransactionDirection.credit) {
        return UserBalanceTransactionDirection.credit
    }

    if (value === UserBalanceTransactionDirection.debit) {
        return UserBalanceTransactionDirection.debit
    }

    throw new AdminUserServiceError('direction must be credit or debit', 400)
}

const normalizeSubscriptionAction = (
    value: unknown,
): 'create' | 'update' | 'cancel' => {
    if (value === undefined || value === null || value === '') {
        return 'update'
    }

    if (value === 'create' || value === 'update' || value === 'cancel') {
        return value
    }

    if (value === 'delete' || value === 'remove') {
        return 'cancel'
    }

    throw new AdminUserServiceError(
        'action must be create, update or cancel',
        400,
    )
}

const normalizeSubscriptionTier = (
    value: unknown,
    required: boolean,
): SubscriptionTier | undefined => {
    if (value === undefined) {
        if (required) {
            throw new AdminUserServiceError('tier is required', 400)
        }

        return undefined
    }

    if (
        value === SubscriptionTier.PLUS ||
        value === SubscriptionTier.PREMIUM ||
        value === SubscriptionTier.LEGENDARY
    ) {
        return value
    }

    throw new AdminUserServiceError(
        'tier must be PLUS, PREMIUM or LEGENDARY',
        400,
    )
}

const normalizeSubscriptionStatus = (
    value: unknown,
): SubscriptionStatus | undefined => {
    if (value === undefined) {
        return undefined
    }

    if (
        value === SubscriptionStatus.pending ||
        value === SubscriptionStatus.active ||
        value === SubscriptionStatus.expired ||
        value === SubscriptionStatus.canceled
    ) {
        return value
    }

    throw new AdminUserServiceError(
        'status must be pending, active, expired or canceled',
        400,
    )
}

const normalizeOptionalDate = (
    value: unknown,
    fieldName: string,
): Date | undefined => {
    if (value === undefined) {
        return undefined
    }

    const date =
        value instanceof Date ? new Date(value) : new Date(String(value))

    if (Number.isNaN(date.getTime())) {
        throw new AdminUserServiceError(
            `${fieldName} must be a valid date`,
            400,
        )
    }

    return date
}

const addDays = (date: Date, days: number): Date => {
    const result = new Date(date)
    result.setDate(result.getDate() + days)

    return result
}

const normalizeOptionalString = (value: unknown): string | null | undefined => {
    if (value === undefined) {
        return undefined
    }

    if (value === null) {
        return null
    }

    if (typeof value !== 'string') {
        return undefined
    }

    const trimmed = value.trim()

    return trimmed.length ? trimmed : null
}

const normalizeBoolean = (value: unknown, fieldName: string): boolean => {
    if (typeof value === 'boolean') {
        return value
    }

    if (value === 'true') {
        return true
    }

    if (value === 'false') {
        return false
    }

    throw new AdminUserServiceError(`${fieldName} must be a boolean`, 400)
}

const normalizeOptionalBoolean = (
    value: unknown,
    fieldName: string,
): boolean | undefined => {
    if (value === undefined) {
        return undefined
    }

    return normalizeBoolean(value, fieldName)
}

const normalizeNullableString = (
    value: unknown,
    fieldName: string,
    maxLength?: number,
): string | null | undefined => {
    if (value === undefined) {
        return undefined
    }

    if (value === null) {
        return null
    }

    if (typeof value !== 'string') {
        throw new AdminUserServiceError(`${fieldName} must be a string`, 400)
    }

    const normalized = value.trim()
    const result = normalized.length ? normalized : null

    if (result && maxLength !== undefined && result.length > maxLength) {
        throw new AdminUserServiceError(
            `${fieldName} must be less than ${maxLength} characters`,
            400,
        )
    }

    return result
}

const normalizeUserRole = (value: unknown): UserRole | undefined => {
    if (value === undefined) {
        return undefined
    }

    if (
        value === UserRole.user ||
        value === UserRole.manager ||
        value === UserRole.admin
    ) {
        return value
    }

    throw new AdminUserServiceError('role must be user, manager or admin', 400)
}

const normalizeUserTheme = (value: unknown): UserTheme | undefined => {
    if (value === undefined) {
        return undefined
    }

    if (
        value === UserTheme.light ||
        value === UserTheme.dark ||
        value === UserTheme.system
    ) {
        return value
    }

    throw new AdminUserServiceError('theme must be light, dark or system', 400)
}

export class AdminUserService {
    async getUser(id: string) {
        if (!id) {
            throw new AdminUserServiceError('User id is required', 400)
        }

        const user = await UserRepository.findById(id)

        if (!user) {
            throw new AdminUserServiceError('User not found', 404)
        }

        const [
            balance,
            subscriptions,
            balanceHistory,
            payments,
            paymentsCount,
            charactersCount,
            characters,
            scenariosCount,
            scenarios,
            activeChatsCount,
            chatsCount,
            chats,
            promoCodes,
            promoCodesCount,
            tasks,
            referredBy,
            referralsCount,
            referrals,
            reactions,
            dailyReward,
        ] = await Promise.all([
            BalanceService.getMyBalance(id),
            UserSubscriptionRepository.getUserSubscriptions(id),
            BalanceService.getHistory({
                userId: id,
                limit: RECENT_LIMIT,
                offset: 0,
            }),
            UserBalancePaymentRepository.findManyByUserId({
                userId: id,
                limit: RECENT_LIMIT,
            }),
            UserBalancePaymentRepository.countByUserId({ userId: id }),
            characterRepository.countByUserId({
                userId: id,
                includeInactive: true,
            }),
            characterRepository.findManyByUserId({
                userId: id,
                includeInactive: true,
                limit: RECENT_LIMIT,
            }),
            scenarioRepository.countByUserId({
                userId: id,
                includeInactive: true,
            }),
            scenarioRepository.findManyByUserId({
                userId: id,
                includeInactive: true,
                limit: RECENT_LIMIT,
            }),
            chatRepository.count({ userId: id }),
            chatRepository.count({ userId: id, includeDeleted: true }),
            chatRepository.findMany({
                userId: id,
                includeDeleted: true,
                limit: RECENT_LIMIT,
            }),
            UserPromoCodeRepository.findManyByUserId(id, {
                limit: RECENT_LIMIT,
            }),
            UserPromoCodeRepository.count({ userId: id }),

            Promise.resolve([]), // tasks временно пустые

            ReferralRepository.findByReferredId(id),
            ReferralRepository.countByReferrerId(id),
            ReferralRepository.findManyByReferrerId(id),
            UserCharacterReactionRepository.findManyByUser(id),
            userDailyRewardRepository.findByUserId(id),
        ])

        const profile = mapUser(user)
        const activeSubscription = subscriptions.find(
            (subscription) => subscription.status === 'active',
        )

        return {
            ...profile,
            balance: balance.balance,
            subscriptions,
            overview: {
                balance: balance.balance,
                subscription: activeSubscription?.tier ?? null,
                charactersCount,
                scenariosCount,
                activeChatsCount,
                chatsCount,
                transactionsCount: balanceHistory.total,
                paymentsCount,
                promoCodesCount,
                tasksCount: tasks.length,
                referralsCount,
                reactionsCount: reactions.length,
            },
            content: {
                charactersCount,
                scenariosCount,
                chatsCount,
                activeChatsCount,
                characters: characters.map((character) =>
                    mapCharacter(character),
                ),
                scenarios: scenarios.map((scenario) => mapScenario(scenario)),
                chats: chats.map((chat) => mapChat(chat)),
            },
            finance: {
                balance: balance.balance,
                transactions: {
                    total: balanceHistory.total,
                    count: balanceHistory.count,
                    limit: balanceHistory.limit,
                    offset: balanceHistory.offset,
                    items: balanceHistory.items,
                },
                payments: {
                    total: paymentsCount,
                    count: payments.length,
                    limit: RECENT_LIMIT,
                    offset: 0,
                    items: payments,
                },
            },
            engagement: {
                promoCodes: {
                    total: promoCodesCount,
                    count: promoCodes.length,
                    items: promoCodes,
                },
                tasks: {
                    total: tasks.length,
                    count: tasks.length,
                    items: tasks,
                },
                referrals: {
                    referredBy: referredBy ? mapReferral(referredBy) : null,
                    total: referralsCount,
                    count: referrals.length,
                    items: referrals.map((referral) => mapReferral(referral)),
                },
                reactions: {
                    total: reactions.length,
                    count: reactions.length,
                    items: reactions,
                },
                dailyReward,
            },
            charactersCount,
            characters: characters.map((character) => mapCharacter(character)),
            scenariosCount,
            scenarios: scenarios.map((scenario) => mapScenario(scenario)),
            chatsCount,
            activeChatsCount,
            chats: chats.map((chat) => mapChat(chat)),
        }
    }

    async updateUser(id: string, payload: UpdateUserPayload) {
        if (!id) {
            throw new AdminUserServiceError('User id is required', 400)
        }

        const existing = await UserRepository.findById(id)

        if (!existing) {
            throw new AdminUserServiceError('User not found', 404)
        }

        const data = {
            username: normalizeNullableString(
                payload.username,
                'username',
                255,
            ),
            first_name: normalizeNullableString(
                payload.first_name,
                'first_name',
                255,
            ),
            last_name: normalizeNullableString(
                payload.last_name,
                'last_name',
                255,
            ),
            languageCode: normalizeNullableString(
                payload.languageCode,
                'languageCode',
                10,
            ),
            photo_url: normalizeNullableString(payload.photo_url, 'photo_url'),
            is_premium: normalizeOptionalBoolean(
                payload.is_premium,
                'is_premium',
            ),
            role: normalizeUserRole(payload.role),
            theme: normalizeUserTheme(payload.theme),
            ban:
                payload.ban !== undefined
                    ? normalizeBoolean(payload.ban, 'ban')
                    : undefined,
            isBanned:
                payload.isBanned !== undefined
                    ? normalizeBoolean(payload.isBanned, 'isBanned')
                    : undefined,
            is_active: normalizeOptionalBoolean(payload.is_active, 'is_active'),
        }

        const updateData = Object.fromEntries(
            Object.entries(data).filter(([, value]) => value !== undefined),
        )

        if (!Object.keys(updateData).length) {
            throw new AdminUserServiceError('No fields to update', 400)
        }

        const user = await UserRepository.updateUser(id, updateData)

        return mapUser(user)
    }

    async updateUserBalance(id: string, payload: UpdateUserBalancePayload) {
        if (!id) {
            throw new AdminUserServiceError('User id is required', 400)
        }

        const user = await UserRepository.findById(id)

        if (!user) {
            throw new AdminUserServiceError('User not found', 404)
        }

        const amount = normalizePositiveInteger(payload.amount, 'amount')
        const direction = normalizeBalanceDirection(payload.direction)
        const description =
            normalizeOptionalString(payload.description) ??
            (direction === UserBalanceTransactionDirection.credit
                ? 'Admin balance credit'
                : 'Admin balance debit')

        try {
            const operation = await BalanceService.applyBalanceOperation({
                userId: id,
                amount,
                direction,
                type:
                    direction === UserBalanceTransactionDirection.credit
                        ? UserBalanceTransactionType.admin_credit
                        : UserBalanceTransactionType.admin_debit,
                entityType: 'AdminUser',
                entityId: id,
                description,
            })

            return {
                user: mapUser(user),
                balance: operation.balance.balance,
                transaction: operation.transaction,
            }
        } catch (error: unknown) {
            if (
                error instanceof Error &&
                error.message === 'INSUFFICIENT_BALANCE'
            ) {
                throw new AdminUserServiceError('Insufficient balance', 409)
            }

            throw error
        }
    }

    async updateUserSubscription(
        id: string,
        payload: UpdateUserSubscriptionPayload = {},
    ) {
        if (!id) {
            throw new AdminUserServiceError('User id is required', 400)
        }

        const user = await UserRepository.findById(id)

        if (!user) {
            throw new AdminUserServiceError('User not found', 404)
        }

        const action = normalizeSubscriptionAction(payload.action)
        const subscriptionId =
            normalizeOptionalString(payload.subscriptionId) ?? undefined

        if (action === 'cancel') {
            const subscription = subscriptionId
                ? await UserSubscriptionRepository.findOwnedById(
                      id,
                      subscriptionId,
                  )
                : await UserSubscriptionRepository.getUserSubscription(id)

            if (!subscription) {
                throw new AdminUserServiceError('Subscription not found', 404)
            }

            const canceled = await UserSubscriptionRepository.cancel(
                subscription.id,
            )

            return {
                user: mapUser(user),
                subscription: mapSubscription(canceled),
            }
        }

        const startsAt = normalizeOptionalDate(payload.startsAt, 'startsAt')
        const durationDays =
            payload.durationDays !== undefined
                ? normalizePositiveInteger(payload.durationDays, 'durationDays')
                : undefined
        const expiresAt = normalizeOptionalDate(payload.expiresAt, 'expiresAt')
        const status =
            normalizeSubscriptionStatus(payload.status) ??
            SubscriptionStatus.active

        if (action === 'create') {
            const tier = normalizeSubscriptionTier(payload.tier, true)
            const nextStartsAt = startsAt ?? new Date()
            const nextExpiresAt =
                expiresAt ??
                (durationDays !== undefined
                    ? addDays(nextStartsAt, durationDays)
                    : undefined)

            if (!nextExpiresAt) {
                throw new AdminUserServiceError(
                    'expiresAt or durationDays is required',
                    400,
                )
            }

            if (nextExpiresAt <= nextStartsAt) {
                throw new AdminUserServiceError(
                    'expiresAt must be later than startsAt',
                    400,
                )
            }

            const subscription = await TransactionRepository.run(async (tx) => {
                const active =
                    await UserSubscriptionRepository.getUserSubscription(id, tx)

                if (active) {
                    await UserSubscriptionRepository.cancel(active.id, tx)
                }

                return UserSubscriptionRepository.create(
                    {
                        userId: id,
                        tier,
                        startsAt: nextStartsAt,
                        expiresAt: nextExpiresAt,
                        status,
                    },
                    tx,
                )
            })

            return {
                user: mapUser(user),
                subscription: mapSubscription(subscription),
            }
        }

        const existing = subscriptionId
            ? await UserSubscriptionRepository.findOwnedById(id, subscriptionId)
            : await UserSubscriptionRepository.getUserSubscription(id)

        if (!existing) {
            if (subscriptionId) {
                throw new AdminUserServiceError('Subscription not found', 404)
            }

            const tier = normalizeSubscriptionTier(payload.tier, true)
            const nextStartsAt = startsAt ?? new Date()
            const nextExpiresAt =
                expiresAt ??
                (durationDays !== undefined
                    ? addDays(nextStartsAt, durationDays)
                    : undefined)

            if (!nextExpiresAt) {
                throw new AdminUserServiceError(
                    'expiresAt or durationDays is required',
                    400,
                )
            }

            if (nextExpiresAt <= nextStartsAt) {
                throw new AdminUserServiceError(
                    'expiresAt must be later than startsAt',
                    400,
                )
            }

            const subscription = await UserSubscriptionRepository.create({
                userId: id,
                tier,
                startsAt: nextStartsAt,
                expiresAt: nextExpiresAt,
                status,
            })

            return {
                user: mapUser(user),
                subscription: mapSubscription(subscription),
            }
        }

        const tier = normalizeSubscriptionTier(payload.tier, false)
        const nextExpiresAt =
            expiresAt ??
            (durationDays !== undefined
                ? addDays(startsAt ?? new Date(), durationDays)
                : undefined)

        if (
            nextExpiresAt !== undefined &&
            nextExpiresAt <= (startsAt ?? existing.startsAt)
        ) {
            throw new AdminUserServiceError(
                'expiresAt must be later than startsAt',
                400,
            )
        }

        const subscriptionUpdateData: {
            tier?: SubscriptionTier
            startsAt?: Date
            expiresAt?: Date
            status?: SubscriptionStatus
        } = {}

        const nextStatus = normalizeSubscriptionStatus(payload.status)

        if (tier !== undefined) {
            subscriptionUpdateData.tier = tier
        }

        if (startsAt !== undefined) {
            subscriptionUpdateData.startsAt = startsAt
        }

        if (nextExpiresAt !== undefined) {
            subscriptionUpdateData.expiresAt = nextExpiresAt
        }

        if (nextStatus !== undefined) {
            subscriptionUpdateData.status = nextStatus
        }

        if (!Object.keys(subscriptionUpdateData).length) {
            throw new AdminUserServiceError(
                'No subscription fields to update',
                400,
            )
        }

        const subscription = await UserSubscriptionRepository.update(
            existing.id,
            subscriptionUpdateData,
        )

        return {
            user: mapUser(user),
            subscription: mapSubscription(subscription),
        }
    }

    async setUserBan(id: string, payload: SetUserBanPayload) {
        if (!id) {
            throw new AdminUserServiceError('User id is required', 400)
        }

        const rawValue =
            payload.isBanned !== undefined ? payload.isBanned : payload.ban
        const isBanned = normalizeBoolean(rawValue, 'isBanned')
        const user = await UserRepository.updateUser(id, {
            ban: isBanned,
        })

        return {
            user: mapUser(user),
        }
    }
}

export const adminUserService = new AdminUserService()
export { AdminUserServiceError }
