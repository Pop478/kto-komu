import bcrypt from 'bcrypt'
import jwt, { type SignOptions } from 'jsonwebtoken'
import crypto from 'node:crypto'
import { createRemoteJWKSet, jwtVerify } from 'jose'
import { UserRole, UserTheme } from '../../generated/prisma/enums.js'
import { config } from '../../config/config.js'
import { UserRepository } from '../../repositories/user.repository.js'
import { UserService } from '../user/user.service.js'
import { logger } from '../../lib/logger.js'

export interface AuthResult {
    user: {
        id: string
        telegramId: string
        username: string | null
        first_name: string | null
        last_name: string | null
        languageCode: string | null
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
            appearance: string | null
            clothing: string | null
            personality: string | null
            interests: string | null
            extraInfo: string | null
        }
        settings: {
            vibration: boolean
            audio: boolean
            profileBackgroundUrl: string | null
        }
        chatSettings: {
            chatBackgroundUrl: string | null
            chatBackgroundColor: string | null
            messageColor: string | null
            messageTextColor: string | null
            otherMessageColor: string | null
            otherMessageTextColor: string | null
            fontFamily: string | null
            fontSize: number
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

export type TelegramMiniAppInput = {
    authData: string
    refCode?: string
    telegramBotId?: string
    adLink?: string
}

export type TelegramBotAuthInput = {
    id: number | string | bigint
    username?: string | null
    first_name?: string | null
    last_name?: string | null
    languageCode?: string | null
    is_premium?: boolean | null
    photo_url?: string | null
    refCode?: string
    adLink?: string
    telegramBotId?: string
}

export type TelegramLoginInput = {
    idToken: string
    refCode?: string
    adLink?: string
}

type TelegramOidcClaims = {
    iss: string
    aud: string | string[]
    sub: string
    iat: number
    exp: number
    id?: string | number
    name?: string
    given_name?: string
    family_name?: string
    preferred_username?: string
    picture?: string
    phone_number?: string
}

export type GoogleAuthInput = {
    code: string
    nonce: string
}

type RegisterByEmailInput = {
    email: string
    password: string
    name?: string
    refCode?: string
    adLink?: string
    turnstileToken: string
    remoteIp?: string
}

type ForgotPasswordInput = {
    email: string
    turnstileToken: string
    remoteIp?: string
}

type ResendVerificationEmailInput = {
    email: string
    turnstileToken: string
    remoteIp?: string
}

type LoginByEmailInput = {
    email: string
    password: string
}

type AuthProviderInput = {
    provider: AuthProvider
    providerUserId: string
    telegramId?: bigint | null
    email?: string | null
    emailVerified?: boolean
    username?: string | null
    first_name?: string | null
    last_name?: string | null
    languageCode?: string | null
    is_premium?: boolean
    photo_url?: string | null
    passwordHash?: string | null
    refCode?: string
    adLink?: string
    telegramBotId?: string
}

const googleClient = new OAuth2Client(
    config.GOOGLE_CLIENT_ID,
    config.GOOGLE_CLIENT_SECRET,
    config.GOOGLE_REDIRECT_URI,
)

type AuthUserResultWithoutToken = Omit<AuthResult, 'accessToken'> & {
    user: Omit<NonNullable<AuthResult['user']>, 'balance'> | null
}

interface TurnstileVerifyResponse {
    success: boolean
    challenge_ts?: string
    hostname?: string
    action?: string
    cdata?: string
    'error-codes'?: string[]
}

const TELEGRAM_ISSUER = 'https://oauth.telegram.org'
const TELEGRAM_JWKS = createRemoteJWKSet(
    new URL('https://oauth.telegram.org/.well-known/jwks.json'),
)

export class AuthService {
    // Telegram Mini App
    async authTelegramMiniApp(
        input: TelegramMiniAppInput,
    ): Promise<AuthResult> {
        const bot =
            input.telegramBotId && /^\d+$/.test(input.telegramBotId)
                ? await TelegramBotRepository.findActiveByBotIdWithToken(
                      BigInt(input.telegramBotId),
                  )
                : await TelegramBotRepository.findMainActiveWithToken()

        if (!bot) {
            throw Object.assign(new Error('Telegram bot not found'), {
                status: 401,
            })
        }

        try {
            validate(input.authData, bot.token, {
                expiresIn: 86400,
            })
        } catch {
            throw Object.assign(new Error('INVALID_TMA_INIT_DATA'), {
                status: 401,
            })
        }

        const init = parse(input.authData)
        const tg = init.user

        if (!tg?.id) {
            throw Object.assign(new Error('TMA_USER_NOT_FOUND'), {
                status: 401,
            })
        }

        const result = await this.authProviderUser({
            provider: 'telegram',
            providerUserId: String(tg.id),
            telegramId: BigInt(tg.id),
            username: tg.username ?? null,
            first_name: tg.first_name ?? null,
            last_name: tg.last_name ?? null,
            photo_url: tg.photo_url ?? null,
            languageCode: tg.language_code ?? null,
            is_premium: tg.is_premium ?? false,
            refCode: input.refCode,
            adLink: input.adLink,
            telegramBotId: bot.id,
        })

        return this.completeAuthResult(result)
    }

    // Авторизация пользователя из Telegram Bot
    async authTelegramBotUser(
        input: TelegramBotAuthInput,
    ): Promise<AuthResult> {
        const telegramIdString = String(input.id)

        if (!/^\d+$/.test(telegramIdString)) {
            throw Object.assign(new Error('INVALID_TELEGRAM_USER_ID'), {
                status: 400,
            })
        }

        const result = await this.authProviderUser({
            provider: AuthProvider.telegram,
            providerUserId: telegramIdString,
            telegramId: BigInt(telegramIdString),
            username: input.username ?? null,
            first_name: input.first_name ?? null,
            last_name: input.last_name ?? null,
            languageCode: input.languageCode ?? null,
            is_premium: input.is_premium ?? false,
            photo_url: input.photo_url ?? null,
            refCode: input.refCode,
            adLink: input.adLink,
            telegramBotId: input.telegramBotId,
        })

        return this.completeAuthResult(result)
    }

    // Telegram Login Widget
    async authTelegramLogin(input: TelegramLoginInput): Promise<AuthResult> {
        const { payload } = await jwtVerify(input.idToken, TELEGRAM_JWKS, {
            issuer: TELEGRAM_ISSUER,
            audience: config.TELEGRAM_CLIENT_ID,
        })
        const claims = payload as TelegramOidcClaims

        const telegramUserId = Number(claims.id)

        if (!Number.isInteger(telegramUserId) || telegramUserId <= 0) {
            throw Object.assign(new Error('INVALID_TELEGRAM_USER_ID'), {
                status: 401,
            })
        }

        const firstName =
            claims.given_name?.trim() || claims.name?.trim() || undefined

        const lastName = claims.family_name?.trim() || undefined

        const result = await this.authProviderUser({
            provider: 'telegram',
            providerUserId: String(claims.id),
            telegramId: BigInt(String(claims.id)),
            username: claims.preferred_username,
            first_name: firstName,
            last_name: lastName,
            photo_url: claims.picture ?? null,
            //           languageCode?: string | null,
            //               refCode?: string
            // adLink?: string
        })

        return this.completeAuthResult(result)
    }

    // Создание ссылки для Google
    createGoogleAuthUrl() {
        const state = crypto.randomBytes(32).toString('hex')
        const nonce = crypto.randomBytes(32).toString('hex')

        const params = new URLSearchParams({
            client_id: config.GOOGLE_CLIENT_ID,
            redirect_uri: config.GOOGLE_REDIRECT_URI,
            response_type: 'code',
            scope: 'openid email profile',
            state,
            nonce,
            prompt: 'select_account',
        })

        return {
            state,
            nonce,
            url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
        }
    }

    // Google OpenID Connect
    async authGoogle(input: GoogleAuthInput): Promise<AuthResult> {
        if (!input.code || !input.nonce) {
            throw Object.assign(new Error('GOOGLE_AUTH_DATA_REQUIRED'), {
                status: 400,
            })
        }

        const { tokens } = await googleClient.getToken({
            code: input.code,
            redirect_uri: config.GOOGLE_REDIRECT_URI,
        })

        if (!tokens.id_token) {
            throw Object.assign(new Error('GOOGLE_ID_TOKEN_NOT_FOUND'), {
                status: 401,
            })
        }

        const ticket = await googleClient.verifyIdToken({
            idToken: tokens.id_token,
            audience: config.GOOGLE_CLIENT_ID,
        })

        const payload = ticket.getPayload()

        if (!payload) {
            throw Object.assign(new Error('GOOGLE_TOKEN_PAYLOAD_NOT_FOUND'), {
                status: 401,
            })
        }

        if (payload.nonce !== input.nonce) {
            throw Object.assign(new Error('INVALID_GOOGLE_NONCE'), {
                status: 401,
            })
        }

        if (!payload.sub || !payload.email) {
            throw Object.assign(new Error('INVALID_GOOGLE_USER_DATA'), {
                status: 401,
            })
        }

        const result = await this.authProviderUser({
            provider: 'google',
            providerUserId: payload.sub,
            email: payload.email,
            emailVerified: payload.email_verified,
            username: payload.email.split('@')[0],
            first_name: payload.given_name ?? payload.name ?? null,
            last_name: payload.family_name ?? null,
            photo_url: payload.picture ?? null,
            //           languageCode?: string | null,
            //               refCode?: string
            // adLink?: string
        })

        return this.completeAuthResult(result)
    }

    // Регистрация пользователя через Email
    async registerByEmail(input: RegisterByEmailInput) {
        const email = input.email.trim().toLowerCase()
        const password = input.password.trim()
        const name = input.name?.trim() || email.split('@')[0]

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            throw new Error('INVALID_EMAIL')
        }

        if (password.length < 8) {
            throw new Error('PASSWORD_TOO_SHORT')
        }

        await this.verifyTurnstileToken({
            token: input.turnstileToken,
            remoteIp: input.remoteIp,
        })

        const existingUser = await UserAuthProviderRepository.getByEmail({
            email,
            provider: AuthProvider.email_password,
        })

        if (existingUser) {
            throw new Error('EMAIL_ALREADY_REGISTERED')
        }

        const passwordHash = await bcrypt.hash(password, 12)

        const result = await this.authProviderUser({
            provider: AuthProvider.email_password,
            providerUserId: email,
            email,
            emailVerified: false,
            username: name,
            passwordHash,
            refCode: input.refCode,
            adLink: input.adLink,
        })

        const rawToken = crypto.randomBytes(32).toString('hex')
        const tokenHash = crypto
            .createHash('sha256')
            .update(rawToken)
            .digest('hex')

        const { expiresInMinutes } =
            await UserEmailTokenRepository.createEmailToken(
                result.user.id,
                tokenHash,
            )

        const activationUrl = `${config.URL}/login/email-verified?token=${rawToken}`

        await emailService.sendActivationMail(
            email,
            activationUrl,
            expiresInMinutes,
        )

        return {
            success: true,
            message: 'REGISTRATION_SUCCESS_CHECK_EMAIL',
        }
    }

    // Проверка ссылке через почту
    async verifyEmail(rawToken: string) {
        const tokenHash = crypto
            .createHash('sha256')
            .update(rawToken)
            .digest('hex')

        const tokenRecord = await UserEmailTokenRepository.getByToken(tokenHash)

        if (!tokenRecord) {
            throw new Error('INVALID_TOKEN')
        }

        if (tokenRecord.expiresAt < new Date()) {
            await UserEmailTokenRepository.deleteByToken(tokenHash)
            throw new Error('TOKEN_EXPIRED')
        }

        await TransactionRepository.run(async (tx) => {
            await UserAuthProviderRepository.markEmailVerifiedByUserId(
                tokenRecord.userId,
                tx,
            )

            await UserEmailTokenRepository.deleteByToken(tokenHash, tx)
        })

        return {
            success: true,
        }
    }

    // Повторная отправка письма для подтверджения почты
    async resendVerificationEmail(input: ResendVerificationEmailInput) {
        const email = input.email.trim().toLowerCase()

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            throw new Error('INVALID_EMAIL')
        }

        await this.verifyTurnstileToken({
            token: input.turnstileToken,
            remoteIp: input.remoteIp,
        })

        const authProvider = await UserAuthProviderRepository.getByEmail({
            email,
            provider: AuthProvider.email_password,
        })

        if (!authProvider) {
            return {
                success: true,
                message: 'IF_EMAIL_EXISTS_WE_SENT_CODE',
            }
        }

        if (authProvider.emailVerified) {
            return {
                success: true,
                message: 'IF_EMAIL_EXISTS_WE_SENT_CODE',
            }
        }

        await UserEmailTokenRepository.deleteByUserId(authProvider.userId)

        const rawToken = crypto.randomBytes(32).toString('hex')
        const tokenHash = crypto
            .createHash('sha256')
            .update(rawToken)
            .digest('hex')

        const { expiresInMinutes } =
            await UserEmailTokenRepository.createEmailToken(
                authProvider.userId,
                tokenHash,
            )

        const activationUrl = `${config.URL}/login/email-verified?token=${rawToken}`

        await emailService.sendActivationMail(
            email,
            activationUrl,
            expiresInMinutes,
        )

        return {
            success: true,
            message: 'IF_EMAIL_EXISTS_WE_SENT_CODE',
        }
    }

    // Вход через Email
    async loginByEmail(input: LoginByEmailInput): Promise<AuthResult> {
        const email = input.email.trim().toLowerCase()
        const password = input.password

        if (!email || !password) {
            throw new Error('EMAIL_AND_PASSWORD_REQUIRED')
        }

        const authProvider = await UserAuthProviderRepository.getByEmail({
            email,
            provider: AuthProvider.email_password,
        })

        if (!authProvider || !authProvider.passwordHash) {
            throw Object.assign(new Error('INVALID_EMAIL_OR_PASSWORD'), {
                status: 401,
            })
        }

        const isPasswordValid = await bcrypt.compare(
            password,
            authProvider.passwordHash,
        )

        if (!isPasswordValid) {
            throw Object.assign(new Error('INVALID_EMAIL_OR_PASSWORD'), {
                status: 401,
            })
        }

        if (authProvider.user.ban) {
            return {
                user: null,
                banned: true,
            }
        }

        if (!authProvider.emailVerified) {
            throw Object.assign(new Error('EMAIL_NOT_VERIFIED'), {
                status: 403,
            })
        }

        const result = await this.authProviderUser({
            provider: AuthProvider.email_password,
            providerUserId: email,
        })

        return this.completeAuthResult(result)
    }

    // Забыл пароль
    async forgotPassword(input: ForgotPasswordInput) {
        const normalizedEmail = input.email.trim().toLowerCase()

        const authProvider = await UserAuthProviderRepository.getByEmail({
            email: normalizedEmail,
            provider: AuthProvider.email_password,
        })

        // Не раскрываем, существует email или нет
        if (!authProvider) {
            return
        }

        await this.verifyTurnstileToken({
            token: input.turnstileToken,
            remoteIp: input.remoteIp,
        })

        const rawToken = crypto.randomBytes(32).toString('hex')
        const tokenHash = crypto
            .createHash('sha256')
            .update(rawToken)
            .digest('hex')

        await UserResetTokenRepository.create(authProvider.userId, tokenHash)

        const resetUrl = `${config.URL}/login/reset-password?token=${rawToken}`

        await emailService.sendResetPasswordEmail({
            to: normalizedEmail,
            resetUrl,
        })
    }

    // Изменение пароля
    async resetPassword(input: { token: string; password: string }) {
        if (input.password.length < 8) {
            throw new Error('PASSWORD_TOO_SHORT')
        }

        const tokenHash = crypto
            .createHash('sha256')
            .update(input.token)
            .digest('hex')

        const resetToken = await UserResetTokenRepository.getByToken(tokenHash)

        if (!resetToken) {
            throw new Error('INVALID_TOKEN')
        }

        if (resetToken.expiresAt < new Date()) {
            throw new Error('TOKEN_EXPIRED')
        }

        const authProvider =
            await UserAuthProviderRepository.getByUserIdAndProvider(
                resetToken.userId,
                AuthProvider.email_password,
            )

        if (!authProvider) {
            throw new Error('EMAIL_AUTH_PROVIDER_NOT_FOUND')
        }

        const passwordHash = await bcrypt.hash(input.password, 12)

        await TransactionRepository.run(async (tx) => {
            await UserAuthProviderRepository.updatePasswordHash(
                authProvider.id,
                passwordHash,
                tx,
            )

            await UserResetTokenRepository.deleteByToken(resetToken.id, tx)
        })
    }

    // Данные пользователя
    async meUser(token: string) {
        const decoded = jwt.verify(token, config.JWT_SECRET) as {
            id?: string
        }

        if (!decoded.id) {
            throw Object.assign(new Error('INVALID_TOKEN'), {
                status: 401,
            })
        }

        const user = await UserRepository.findById(decoded.id)

        if (!user || user.ban) {
            throw Object.assign(new Error('USER_NOT_FOUND_OR_BANNED'), {
                status: 401,
            })
        }

        const userBalance = await UserBalanceRepository.getByUserId(user.id)

        const userProfile = await UserProfileRepository.findOrCreateByUserId(
            user.id,
            {
                name: user.first_name,
            },
        )

        return {
            id: user.id,
            telegramId: user.telegramId?.toString() ?? null,
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
            gender: userProfile.gender,
            balance: userBalance?.balance ?? 0,
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
        }
    }

    // Создание/Изменение пользователя из всех источников
    private async authUser(
        tgUser: TelegramStartUser,
        refCode?: string,
        adLink?: string,
        telegramBotId?: string,
    ): Promise<AuthUserResultWithoutToken> {
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

        const userProfile = await UserProfileRepository.findOrCreateByUserId(
            user.id,
            {
                name: first_name,
            },
        )

        if (adLink) {
            await this.tryCreateAdClick({
                adLink,
                userId: user.id,
                isNewUser,
            })
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
                gender: userProfile.gender,
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

    // Авторизация и создание профиля
    private async authProviderUser(
        input: AuthProviderInput,
    ): Promise<AuthUserResultWithoutToken> {
        const existingProvider = await UserAuthProviderRepository.get({
            provider: input.provider,
            providerUserId: input.providerUserId,
        })

        if (existingProvider?.user.ban) {
            return {
                user: null,
                banned: true,
            }
        }

        const isNewUser = !existingProvider

        const user = existingProvider
            ? await UserService.updateUserData({
                  id: existingProvider.userId,
                  username: input.username ?? undefined,
                  first_name: input.first_name ?? undefined,
                  last_name: input.last_name ?? undefined,
                  languageCode: input.languageCode ?? undefined,
                  is_premium: input.is_premium ?? undefined,
                  //   photo_url: input.photo_url ?? undefined,
              })
            : await UserService.createUserWithProvider({
                  provider: input.provider,
                  providerUserId: input.providerUserId,
                  telegramId: input.telegramId ?? null,
                  email: input.email ?? null,
                  emailVerified: input.emailVerified ?? false,
                  username: input.username ?? null,
                  first_name: input.first_name ?? null,
                  last_name: input.last_name ?? null,
                  languageCode: input.languageCode ?? null,
                  is_premium: input.is_premium ?? false,
                  photo_url: input.photo_url ?? null,
                  passwordHash: input.passwordHash ?? null,
                  refCode: input.refCode,
                  telegramBotId: input.telegramBotId,
              })

        const userProfile = await UserProfileRepository.findOrCreateByUserId(
            user.id,
            {
                name: input.first_name ?? user.first_name,
            },
        )
        const userChatSettings = await UserChatSettingsRepository.find(user.id)

        if (input.adLink) {
            await this.tryCreateAdClick({
                adLink: input.adLink,
                userId: user.id,
                isNewUser,
            })
        }

        return {
            user: {
                id: user.id,
                telegramId: user.telegramId?.toString() ?? '',
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
                gender: userProfile.gender,
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
                settings: {
                    vibration: user.settings.vibration,
                    audio: user.settings.audio,
                    profileBackgroundUrl: user.settings.profileBackgroundUrl,
                },
                chatSettings: {
                    chatBackgroundUrl:
                        userChatSettings?.chatBackgroundUrl ?? null,
                    chatBackgroundColor:
                        userChatSettings?.chatBackgroundColor ?? null,
                    messageColor: userChatSettings?.messageColor ?? null,
                    messageTextColor:
                        userChatSettings?.messageTextColor ?? null,
                    otherMessageColor:
                        userChatSettings?.otherMessageColor ?? null,
                    otherMessageTextColor:
                        userChatSettings?.otherMessageTextColor ?? null,
                    fontFamily: userChatSettings?.fontFamily ?? null,
                    fontSize: userChatSettings?.fontSize ?? null,
                },
            },
            isNewUser,
        }
    }

    // Получение под данных и возвращает
    private async completeAuthResult(
        result: AuthUserResultWithoutToken,
    ): Promise<AuthResult> {
        if (result.banned) {
            return {
                user: null,
                banned: true,
            }
        }

        if (!result.user) {
            throw Object.assign(new Error('USER_CREATION_FAILED'), {
                status: 500,
            })
        }

        // Вознаграждение за подписку
        await SubscriptionDailyRewardService.issueMissedRewards(result.user.id)

        const userBalance = await UserBalanceRepository.getByUserId(
            result.user.id,
        )
        const userSubscription =
            await UserSubscriptionRepository.getUserSubscription(result.user.id)

        const user = {
            ...result.user,
            balance: userBalance?.balance ?? 0,
            subscription: userSubscription
                ? {
                      tier: userSubscription.tier,
                      startsAt: userSubscription.startsAt,
                      expiresAt: userSubscription.expiresAt,
                  }
                : null,
        }

        const accessToken = this.createAccessToken(user)

        return {
            user,
            accessToken,
            isNewUser: result.isNewUser,
        }
    }

    // Создание JWT токена
    private createAccessToken(user: NonNullable<AuthResult['user']>) {
        return jwt.sign(
            {
                id: user.id,
                telegramId: user.telegramId,
                name: user.profile.name,
                username: user.username,
                first_name: user.first_name,
                last_name: user.last_name,
                is_premium: user.is_premium,
                languageCode: user.languageCode,
                photo_url: user.photo_url,
                role: user.role,
            },
            config.JWT_SECRET,
            {
                expiresIn: config.JWT_EXPIRES as SignOptions['expiresIn'],
            } satisfies SignOptions,
        )
    }

    // Отметка на рекламную ссылку
    private async tryCreateAdClick(input: {
        adLink: string
        userId: string
        isNewUser: boolean
    }) {
        try {
            const normalizedAdLink = input.adLink.trim()

            if (!normalizedAdLink) {
                return
            }

            const activeAdLink =
                await AdLinkRepository.findActiveByLink(normalizedAdLink)

            if (!activeAdLink) {
                return
            }

            await AdClickRepository.create({
                adLinkId: activeAdLink.id,
                userId: input.userId,
                isNewUser: input.isNewUser,
            })
        } catch (error) {
            console.error('[AuthService] failed to create ad click:', error)
        }
    }

    private async verifyTurnstileToken(input: {
        token: string
        remoteIp?: string
    }): Promise<void> {
        const secretKey = config.TURNSTILE_SECRET_KEY

        if (!secretKey) {
            logger.error('TURNSTILE_SECRET_KEY is not configured')
            throw new Error('CAPTCHA_CONFIGURATION_ERROR')
        }

        const body = new URLSearchParams({
            secret: secretKey,
            response: input.token,
        })

        if (input.remoteIp) {
            body.set('remoteip', input.remoteIp)
        }

        let response: Response

        try {
            response = await fetch(
                'https://challenges.cloudflare.com/turnstile/v0/siteverify',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body,
                    signal: AbortSignal.timeout(5000),
                },
            )
        } catch (error) {
            logger.error('Turnstile verification request failed', {
                error: error instanceof Error ? error.message : 'Unknown error',
            })

            throw new Error('CAPTCHA_SERVICE_UNAVAILABLE')
        }

        if (!response.ok) {
            logger.error('Turnstile verification returned invalid status', {
                status: response.status,
            })

            throw new Error('CAPTCHA_SERVICE_UNAVAILABLE')
        }

        const result = (await response.json()) as TurnstileVerifyResponse

        if (!result.success) {
            logger.warn('Turnstile token verification failed', {
                errorCodes: result['error-codes'],
                hostname: result.hostname,
                action: result.action,
            })

            throw new Error('CAPTCHA_INVALID')
        }

        const allowedHostnames =
            process.env.NODE_ENV === 'production'
                ? ['vwaifu.org', 'www.vwaifu.org']
                : ['localhost', '127.0.0.1', 'vwaifu.org']

        if (result.hostname && !allowedHostnames.includes(result.hostname)) {
            logger.warn('Turnstile hostname mismatch', {
                hostname: result.hostname,
            })

            throw new Error('CAPTCHA_HOSTNAME_INVALID')
        }

        if (result.action && result.action !== 'email_register') {
            logger.warn('Turnstile action mismatch', {
                action: result.action,
            })

            throw new Error('CAPTCHA_ACTION_INVALID')
        }
    }
}

export const authService = new AuthService()
