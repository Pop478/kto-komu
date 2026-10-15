import { parse, validate } from '@tma.js/init-data-node'
import jwt, { type SignOptions } from 'jsonwebtoken'
import { Gender, UserRole, UserTheme } from '../../generated/prisma/enums.js'
import { config } from '../../config/config.js'
import { UserRepository } from '../../repositories/user.repository.js'
import { UserService } from '../user/user.service.js'
import { UserBalanceRepository } from '../../repositories/balance/userBalance.repository.js'
import { TelegramBotRepository } from '../../repositories/telegramBot.repository.js'
import { AdLinkRepository } from '../../repositories/adLink.repository.js'
import { AdClickRepository } from '../../repositories/adClick.repository.js'
import { UserProfileRepository } from '../../repositories/userProfile.repository.js'

export interface AuthResult {
    user: {
        id: string
        telegramId: string
        username: string | null
        first_name: string | null
        last_name: string | null
        languageCode: string | null
        gender: Gender
        photo_url: string | null
        is_premium: boolean
        role: UserRole
        theme: UserTheme
        termsAccepted: boolean
        createdAt: Date
        balance: number
        profile: {
            id: string
            isDefault: boolean
            name: string
            gender: Gender
            appearance: string | null
            clothing: string | null
            personality: string | null
            interests: string | null
            extraInfo: string | null
        }
    } | null
    banned?: boolean
    accessToken?: string
    isNewUser?: boolean
}

interface TelegramStartUser {
    id: number
    username?: string
    first_name?: string
    last_name?: string
    languageCode?: string
    is_premium?: boolean
    photo_url?: string
}

export async function authUser(
    tgUser: TelegramStartUser,
    refCode?: string,
    adLink?: string,
    telegramBotId?: string,
): Promise<AuthResult> {
    void refCode

    const telegramId = BigInt(tgUser.id)
    const username = tgUser.username ?? null
    const first_name = tgUser.first_name ?? null
    const last_name = tgUser.last_name ?? null
    const languageCode = tgUser.languageCode ?? null
    const is_premium = tgUser.is_premium ?? false
    const photo_url = tgUser.photo_url ?? null

    const existing = await UserRepository.findByTelegramId(telegramId)

    if (existing?.ban) {
        return {
            user: null,
            banned: true,
        }
    }

    const isNewUser = !existing

    const user = existing
        ? await UserService.updateUserData({
              id: existing.id,
              username,
              first_name,
              last_name,
              languageCode,
              is_premium,
              photo_url,
          })
        : await UserService.createUser({
              telegramId,
              username,
              first_name,
              last_name,
              languageCode,
              is_premium,
              photo_url,
              refCode,
              telegramBotId,
          })

    // Профиль пользователя с актуальнуми данными
    const userProfile = await UserProfileRepository.findOrCreateByUserId(
        user.id,
        {
            name: first_name,
        },
    )

    if (adLink) {
        try {
            const normalizedAdLink = adLink.trim()

            if (normalizedAdLink) {
                const activeAdLink =
                    await AdLinkRepository.findActiveByLink(normalizedAdLink)

                if (activeAdLink) {
                    await AdClickRepository.create({
                        adLinkId: activeAdLink.id,
                        userId: user.id,
                        isNewUser,
                    })
                }
            }
        } catch (error) {
            console.error('[authUser] failed to create ad click:', error)
        }
    }

    return {
        user: {
            id: user.id,
            telegramId: user.telegramId.toString(),
            username: user.username,
            first_name: user.first_name,
            last_name: user.last_name,
            languageCode: user.languageCode,
            is_premium: user.is_premium,
            role: user.role,
            photo_url: user.photo_url,
            theme: user.theme,
            termsAccepted: user.termsAccepted,
            createdAt: user.createdAt,
            profile: {
                id: userProfile.id,
                isDefault: userProfile.isDefault,
                name: userProfile.name,
                gender: userProfile.gender,
                appearance: userProfile.appearance,
                clothing: userProfile.clothing,
                personality: userProfile.personality,
                interests: userProfile.interests,
                extraInfo: userProfile.extraInfo,
            },
        },
        isNewUser,
    }
}

export async function tmaAuthUser(
    authData: string,
    refCode?: string,
    telegramBotId?: string,
    adLink?: string,
): Promise<AuthResult> {
    const bot =
        telegramBotId && /^\d+$/.test(telegramBotId)
            ? await TelegramBotRepository.findActiveByBotIdWithToken(
                  BigInt(telegramBotId),
              )
            : await TelegramBotRepository.findMainActiveWithToken()

    if (!bot) {
        throw Object.assign(new Error('Telegram bot not found'), {
            status: 401,
        })
    }

    try {
        validate(authData, bot.token, { expiresIn: 86400 })
    } catch {
        throw Object.assign(new Error('Invalid initData'), { status: 401 })
    }

    const init = parse(authData)
    const tg = init.user

    if (!tg?.id) {
        throw Object.assign(new Error('Invalid initData'), { status: 401 })
    }

    const result = await authUser(
        {
            id: tg.id,
            username: tg.username,
            first_name: tg.first_name,
            last_name: tg.last_name,
            languageCode: tg.language_code,
            is_premium: tg.is_premium,
            photo_url: tg.photo_url,
        },
        refCode,
        adLink,
        bot.id,
    )

    if (result.banned) {
        return {
            user: null,
            banned: true,
        }
    }

    if (!result.user) {
        throw Object.assign(new Error('User creation failed'), { status: 500 })
    }

    const userBalance = await UserBalanceRepository.getByUserId(result.user.id)

    const accessToken = jwt.sign(
        {
            id: result.user.id,
            telegramId: result.user.telegramId,
            name: result.user.profile.name,
            username: result.user.username,
            first_name: result.user.first_name,
            last_name: result.user.last_name,
            is_premium: result.user.is_premium,
            languageCode: result.user.languageCode,
            photo_url: result.user.photo_url,
            role: result.user.role,
        },
        config.JWT_SECRET,
        {
            expiresIn: config.JWT_EXPIRES as SignOptions['expiresIn'],
        } satisfies SignOptions,
    )

    return {
        user: {
            ...result.user,
            balance: userBalance?.balance ?? 0,
        },
        accessToken,
        isNewUser: result.isNewUser,
    }
}

export const AuthUser = tmaAuthUser
