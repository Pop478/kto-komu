import jwt, { type SignOptions } from 'jsonwebtoken'
import crypto from 'node:crypto'
import { config } from '../../config/config.js'
import {
    AccountStatus,
    Gender,
    UserTheme,
} from '../../generated/prisma/enums.js'
import { OAuthIdentityRepository } from '../../repositories/oauth-identity.repository.js'
import { TransactionRepository } from '../../repositories/transaction.repository.js'
import { UserRepository } from '../../repositories/user.repository.js'

export interface AuthResult {
    user: AuthUser | null
    banned?: boolean
    accessToken?: string
    isNewUser?: boolean
}

type AuthUser = {
    id: string
    username: string | null
    firstName: string | null
    lastName: string | null
    gender: Gender | null
    birthDate: Date | null
    photoUrl: string | null
    email: string | null
    emailVerifiedAt: Date | null
    languageCode: string | null
    theme: UserTheme
    status: AccountStatus
    termsAccepted: boolean
    createdAt: Date
    providers: Array<{
        provider: string
        providerUserId: string
    }>
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
export interface YandexAuthInput {
    code: string
    codeVerifier: string
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
    provider: string
    providerUserId: string
    email?: string | null
    emailVerified?: boolean
    username?: string | null
    firstName?: string | null
    lastName?: string | null
    gender?: Gender | null
    birthDate?: Date | null
    languageCode?: string | null
    photoUrl?: string | null
}

// const googleClient = new OAuth2Client(
//     config.GOOGLE_CLIENT_ID,
//     config.GOOGLE_CLIENT_SECRET,
//     config.GOOGLE_REDIRECT_URI,
// )

type AuthUserResultWithoutToken = {
    user: AuthUser | null
    banned?: boolean
    isNewUser?: boolean
}

interface TurnstileVerifyResponse {
    success: boolean
    challenge_ts?: string
    hostname?: string
    action?: string
    cdata?: string
    'error-codes'?: string[]
}

export class AuthService {
    // // Создание ссылки для Google
    // createGoogleAuthUrl() {
    //     const state = crypto.randomBytes(32).toString('hex')
    //     const nonce = crypto.randomBytes(32).toString('hex')

    //     const params = new URLSearchParams({
    //         client_id: config.GOOGLE_CLIENT_ID,
    //         redirect_uri: config.GOOGLE_REDIRECT_URI,
    //         response_type: 'code',
    //         scope: 'openid email profile',
    //         state,
    //         nonce,
    //         prompt: 'select_account',
    //     })

    //     return {
    //         state,
    //         nonce,
    //         url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
    //     }
    // }

    // // Google OpenID Connect
    // async authGoogle(input: GoogleAuthInput): Promise<AuthResult> {
    //     if (!input.code || !input.nonce) {
    //         throw Object.assign(new Error('GOOGLE_AUTH_DATA_REQUIRED'), {
    //             status: 400,
    //         })
    //     }

    //     const { tokens } = await googleClient.getToken({
    //         code: input.code,
    //         redirect_uri: config.GOOGLE_REDIRECT_URI,
    //     })

    //     if (!tokens.id_token) {
    //         throw Object.assign(new Error('GOOGLE_ID_TOKEN_NOT_FOUND'), {
    //             status: 401,
    //         })
    //     }

    //     const ticket = await googleClient.verifyIdToken({
    //         idToken: tokens.id_token,
    //         audience: config.GOOGLE_CLIENT_ID,
    //     })

    //     const payload = ticket.getPayload()

    //     if (!payload) {
    //         throw Object.assign(new Error('GOOGLE_TOKEN_PAYLOAD_NOT_FOUND'), {
    //             status: 401,
    //         })
    //     }

    //     if (payload.nonce !== input.nonce) {
    //         throw Object.assign(new Error('INVALID_GOOGLE_NONCE'), {
    //             status: 401,
    //         })
    //     }

    //     if (!payload.sub || !payload.email) {
    //         throw Object.assign(new Error('INVALID_GOOGLE_USER_DATA'), {
    //             status: 401,
    //         })
    //     }

    //     const result = await this.authProviderUser({
    //         provider: 'google',
    //         providerUserId: payload.sub,
    //         email: payload.email,
    //         emailVerified: payload.email_verified,
    //         username: payload.email.split('@')[0],
    //         first_name: payload.given_name ?? payload.name ?? null,
    //         last_name: payload.family_name ?? null,
    //         photo_url: payload.picture ?? null,
    //         //           languageCode?: string | null,
    //         //               refCode?: string
    //         // adLink?: string
    //     })

    //     return this.completeAuthResult(result)
    // }

    // Создание ссылки для Yandex
    createYandexAuthUrl() {
        const state = crypto.randomBytes(32).toString('hex')
        const codeVerifier = crypto.randomBytes(32).toString('base64url')

        const codeChallenge = crypto
            .createHash('sha256')
            .update(codeVerifier)
            .digest('base64url')

        const params = new URLSearchParams({
            response_type: 'code',
            client_id: config.YANDEX_CLIENT_ID,
            redirect_uri: config.YANDEX_REDIRECT_URI,
            scope: 'login:info login:email login:avatar login:default_phone login:birthday',
            state,
            code_challenge: codeChallenge,
            code_challenge_method: 'S256',
        })

        return {
            state,
            codeVerifier,
            url: `https://oauth.yandex.ru/authorize?${params.toString()}`,
        }
    }

    // Yandex OpenID Connect
    async authYandex(input: YandexAuthInput): Promise<AuthResult> {
        const { code, codeVerifier } = input

        if (!code || !codeVerifier) {
            throw Object.assign(new Error('YANDEX_AUTH_DATA_REQUIRED'), {
                status: 400,
            })
        }

        // 1. Обмениваем код на OAuth-токен Яндекса
        const tokenResponse = await fetch('https://oauth.yandex.ru/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code,
                client_id: config.YANDEX_CLIENT_ID,
                code_verifier: codeVerifier,
            }),
            signal: AbortSignal.timeout(10000),
        })

        if (!tokenResponse.ok) {
            throw Object.assign(new Error('YANDEX_TOKEN_EXCHANGE_FAILED'), {
                status: 401,
            })
        }

        const tokens = (await tokenResponse.json()) as {
            access_token?: string
            token_type?: string
            expires_in?: number
        }

        if (!tokens.access_token) {
            throw Object.assign(new Error('YANDEX_ACCESS_TOKEN_NOT_FOUND'), {
                status: 401,
            })
        }

        // 2. Получаем профиль от Яндекса
        const userResponse = await fetch(
            'https://login.yandex.ru/info?format=json',
            {
                headers: {
                    Authorization: `OAuth ${tokens.access_token}`,
                },
                signal: AbortSignal.timeout(10000),
            },
        )

        if (!userResponse.ok) {
            throw Object.assign(new Error('YANDEX_USER_INFO_FAILED'), {
                status: 401,
            })
        }

        const payload = (await userResponse.json()) as {
            id?: string
            client_id?: string
            login?: string
            first_name?: string
            last_name?: string
            default_email?: string
            sex?: 'male' | 'female'
            birthday?: string
            default_avatar_id?: string
            is_avatar_empty?: boolean
        }

        // 3. Проверяем идентичность пользователя
        if (
            !payload.id ||
            (payload.client_id !== undefined &&
                payload.client_id !== config.YANDEX_CLIENT_ID)
        ) {
            throw Object.assign(new Error('INVALID_YANDEX_USER_DATA'), {
                status: 401,
            })
        }

        // 4. Преобразуем необязательные данные
        let birthDate: Date | null = null

        if (
            payload.birthday &&
            /^\d{4}-\d{2}-\d{2}$/.test(payload.birthday) &&
            !payload.birthday.startsWith('0000-')
        ) {
            const parsed = new Date(`${payload.birthday}T00:00:00.000Z`)

            if (
                !Number.isNaN(parsed.getTime()) &&
                parsed.toISOString().slice(0, 10) === payload.birthday
            ) {
                birthDate = parsed
            }
        }

        const photoUrl =
            payload.default_avatar_id && !payload.is_avatar_empty
                ? `https://avatars.yandex.net/get-yapic/${encodeURIComponent(
                      payload.default_avatar_id,
                  )}/islands-200`
                : null

        // 5. Создаём или находим аккаунт приложения
        const result = await this.authProviderUser({
            provider: 'yandex',
            providerUserId: payload.id,
            email: payload.default_email ?? null,

            // Не считаем email автоматически подтверждённым,
            // пока не определена соответствующая политика.
            emailVerified: false,

            username: payload.login ?? null,
            firstName: payload.first_name ?? null,
            lastName: payload.last_name ?? null,
            photoUrl,

            // Добавь поля в authProviderUser при необходимости:
            gender:
                payload.sex === 'male'
                    ? Gender.MALE
                    : payload.sex === 'female'
                      ? Gender.FEMALE
                      : null,
            birthDate,
        })

        // 6. Выдаём собственные JWT и Refresh Token
        return this.completeAuthResult(result)
    }

    // // Регистрация пользователя через Email
    // async registerByEmail(input: RegisterByEmailInput) {
    //     const email = input.email.trim().toLowerCase()
    //     const password = input.password.trim()
    //     const name = input.name?.trim() || email.split('@')[0]

    //     if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    //         throw new Error('INVALID_EMAIL')
    //     }

    //     if (password.length < 8) {
    //         throw new Error('PASSWORD_TOO_SHORT')
    //     }

    //     await this.verifyTurnstileToken({
    //         token: input.turnstileToken,
    //         remoteIp: input.remoteIp,
    //     })

    //     const existingUser = await UserAuthProviderRepository.getByEmail({
    //         email,
    //         provider: AuthProvider.email_password,
    //     })

    //     if (existingUser) {
    //         throw new Error('EMAIL_ALREADY_REGISTERED')
    //     }

    //     const passwordHash = await bcrypt.hash(password, 12)

    //     const result = await this.authProviderUser({
    //         provider: AuthProvider.email_password,
    //         providerUserId: email,
    //         email,
    //         emailVerified: false,
    //         username: name,
    //         passwordHash,
    //         refCode: input.refCode,
    //         adLink: input.adLink,
    //     })

    //     const rawToken = crypto.randomBytes(32).toString('hex')
    //     const tokenHash = crypto
    //         .createHash('sha256')
    //         .update(rawToken)
    //         .digest('hex')

    //     const { expiresInMinutes } =
    //         await UserEmailTokenRepository.createEmailToken(
    //             result.user.id,
    //             tokenHash,
    //         )

    //     const activationUrl = `${config.URL}/login/email-verified?token=${rawToken}`

    //     await emailService.sendActivationMail(
    //         email,
    //         activationUrl,
    //         expiresInMinutes,
    //     )

    //     return {
    //         success: true,
    //         message: 'REGISTRATION_SUCCESS_CHECK_EMAIL',
    //     }
    // }

    // // Проверка ссылке через почту
    // async verifyEmail(rawToken: string) {
    //     const tokenHash = crypto
    //         .createHash('sha256')
    //         .update(rawToken)
    //         .digest('hex')

    //     const tokenRecord = await UserEmailTokenRepository.getByToken(tokenHash)

    //     if (!tokenRecord) {
    //         throw new Error('INVALID_TOKEN')
    //     }

    //     if (tokenRecord.expiresAt < new Date()) {
    //         await UserEmailTokenRepository.deleteByToken(tokenHash)
    //         throw new Error('TOKEN_EXPIRED')
    //     }

    //     await TransactionRepository.run(async (tx) => {
    //         await UserAuthProviderRepository.markEmailVerifiedByUserId(
    //             tokenRecord.userId,
    //             tx,
    //         )

    //         await UserEmailTokenRepository.deleteByToken(tokenHash, tx)
    //     })

    //     return {
    //         success: true,
    //     }
    // }

    // // Повторная отправка письма для подтверджения почты
    // async resendVerificationEmail(input: ResendVerificationEmailInput) {
    //     const email = input.email.trim().toLowerCase()

    //     if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    //         throw new Error('INVALID_EMAIL')
    //     }

    //     await this.verifyTurnstileToken({
    //         token: input.turnstileToken,
    //         remoteIp: input.remoteIp,
    //     })

    //     const authProvider = await UserAuthProviderRepository.getByEmail({
    //         email,
    //         provider: AuthProvider.email_password,
    //     })

    //     if (!authProvider) {
    //         return {
    //             success: true,
    //             message: 'IF_EMAIL_EXISTS_WE_SENT_CODE',
    //         }
    //     }

    //     if (authProvider.emailVerified) {
    //         return {
    //             success: true,
    //             message: 'IF_EMAIL_EXISTS_WE_SENT_CODE',
    //         }
    //     }

    //     await UserEmailTokenRepository.deleteByUserId(authProvider.userId)

    //     const rawToken = crypto.randomBytes(32).toString('hex')
    //     const tokenHash = crypto
    //         .createHash('sha256')
    //         .update(rawToken)
    //         .digest('hex')

    //     const { expiresInMinutes } =
    //         await UserEmailTokenRepository.createEmailToken(
    //             authProvider.userId,
    //             tokenHash,
    //         )

    //     const activationUrl = `${config.URL}/login/email-verified?token=${rawToken}`

    //     await emailService.sendActivationMail(
    //         email,
    //         activationUrl,
    //         expiresInMinutes,
    //     )

    //     return {
    //         success: true,
    //         message: 'IF_EMAIL_EXISTS_WE_SENT_CODE',
    //     }
    // }

    // // Вход через Email
    // async loginByEmail(input: LoginByEmailInput): Promise<AuthResult> {
    //     const email = input.email.trim().toLowerCase()
    //     const password = input.password

    //     if (!email || !password) {
    //         throw new Error('EMAIL_AND_PASSWORD_REQUIRED')
    //     }

    //     const authProvider = await UserAuthProviderRepository.getByEmail({
    //         email,
    //         provider: AuthProvider.email_password,
    //     })

    //     if (!authProvider || !authProvider.passwordHash) {
    //         throw Object.assign(new Error('INVALID_EMAIL_OR_PASSWORD'), {
    //             status: 401,
    //         })
    //     }

    //     const isPasswordValid = await bcrypt.compare(
    //         password,
    //         authProvider.passwordHash,
    //     )

    //     if (!isPasswordValid) {
    //         throw Object.assign(new Error('INVALID_EMAIL_OR_PASSWORD'), {
    //             status: 401,
    //         })
    //     }

    //     if (authProvider.user.ban) {
    //         return {
    //             user: null,
    //             banned: true,
    //         }
    //     }

    //     if (!authProvider.emailVerified) {
    //         throw Object.assign(new Error('EMAIL_NOT_VERIFIED'), {
    //             status: 403,
    //         })
    //     }

    //     const result = await this.authProviderUser({
    //         provider: AuthProvider.email_password,
    //         providerUserId: email,
    //     })

    //     return this.completeAuthResult(result)
    // }

    // // Забыл пароль
    // async forgotPassword(input: ForgotPasswordInput) {
    //     const normalizedEmail = input.email.trim().toLowerCase()

    //     const authProvider = await UserAuthProviderRepository.getByEmail({
    //         email: normalizedEmail,
    //         provider: AuthProvider.email_password,
    //     })

    //     // Не раскрываем, существует email или нет
    //     if (!authProvider) {
    //         return
    //     }

    //     await this.verifyTurnstileToken({
    //         token: input.turnstileToken,
    //         remoteIp: input.remoteIp,
    //     })

    //     const rawToken = crypto.randomBytes(32).toString('hex')
    //     const tokenHash = crypto
    //         .createHash('sha256')
    //         .update(rawToken)
    //         .digest('hex')

    //     await UserResetTokenRepository.create(authProvider.userId, tokenHash)

    //     const resetUrl = `${config.URL}/login/reset-password?token=${rawToken}`

    //     await emailService.sendResetPasswordEmail({
    //         to: normalizedEmail,
    //         resetUrl,
    //     })
    // }

    // // Изменение пароля
    // async resetPassword(input: { token: string; password: string }) {
    //     if (input.password.length < 8) {
    //         throw new Error('PASSWORD_TOO_SHORT')
    //     }

    //     const tokenHash = crypto
    //         .createHash('sha256')
    //         .update(input.token)
    //         .digest('hex')

    //     const resetToken = await UserResetTokenRepository.getByToken(tokenHash)

    //     if (!resetToken) {
    //         throw new Error('INVALID_TOKEN')
    //     }

    //     if (resetToken.expiresAt < new Date()) {
    //         throw new Error('TOKEN_EXPIRED')
    //     }

    //     const authProvider =
    //         await UserAuthProviderRepository.getByUserIdAndProvider(
    //             resetToken.userId,
    //             AuthProvider.email_password,
    //         )

    //     if (!authProvider) {
    //         throw new Error('EMAIL_AUTH_PROVIDER_NOT_FOUND')
    //     }

    //     const passwordHash = await bcrypt.hash(input.password, 12)

    //     await TransactionRepository.run(async (tx) => {
    //         await UserAuthProviderRepository.updatePasswordHash(
    //             authProvider.id,
    //             passwordHash,
    //             tx,
    //         )

    //         await UserResetTokenRepository.deleteByToken(resetToken.id, tx)
    //     })
    // }

    // Данные пользователя

    // // Создание/Изменение пользователя из всех источников
    // private async authUser(
    //     tgUser: TelegramStartUser,
    //     refCode?: string,
    //     adLink?: string,
    //     telegramBotId?: string,
    // ): Promise<AuthUserResultWithoutToken> {
    //     const telegramId = BigInt(tgUser.id)

    //     const username = tgUser.username ?? null
    //     const first_name = tgUser.first_name ?? null
    //     const last_name = tgUser.last_name ?? null
    //     const languageCode = tgUser.languageCode ?? null
    //     const is_premium = tgUser.is_premium ?? false
    //     const photo_url = tgUser.photo_url ?? null

    //     const existing = await UserRepository.findByTelegramId(telegramId)

    //     if (existing?.ban) {
    //         return {
    //             user: null,
    //             banned: true,
    //         }
    //     }

    //     const isNewUser = !existing

    //     const user = existing
    //         ? await UserService.updateUserData({
    //               id: existing.id,
    //               username,
    //               first_name,
    //               last_name,
    //               languageCode,
    //               is_premium,
    //               photo_url,
    //           })
    //         : await UserService.createUser({
    //               telegramId,
    //               username,
    //               first_name,
    //               last_name,
    //               languageCode,
    //               is_premium,
    //               photo_url,
    //               refCode,
    //               telegramBotId,
    //           })

    //     const userProfile = await UserProfileRepository.findOrCreateByUserId(
    //         user.id,
    //         {
    //             name: first_name,
    //         },
    //     )

    //     if (adLink) {
    //         await this.tryCreateAdClick({
    //             adLink,
    //             userId: user.id,
    //             isNewUser,
    //         })
    //     }

    //     return {
    //         user: {
    //             id: user.id,
    //             telegramId: user.telegramId.toString(),
    //             username: user.username,
    //             first_name: user.first_name,
    //             last_name: user.last_name,
    //             languageCode: user.languageCode,
    //             is_premium: user.is_premium,
    //             role: user.role,
    //             photo_url: user.photo_url,
    //             theme: user.theme,
    //             termsAccepted: user.termsAccepted,
    //             createdAt: user.createdAt,
    //             gender: userProfile.gender,
    //             profile: {
    //                 id: userProfile.id,
    //                 isDefault: userProfile.isDefault,
    //                 name: userProfile.name,
    //                 gender: userProfile.gender,
    //                 appearance: userProfile.appearance,
    //                 clothing: userProfile.clothing,
    //                 personality: userProfile.personality,
    //                 interests: userProfile.interests,
    //                 extraInfo: userProfile.extraInfo,
    //             },
    //         },
    //         isNewUser,
    //     }
    // }

    // Авторизация и создание профиля
    private async authProviderUser(
        input: AuthProviderInput,
    ): Promise<AuthUserResultWithoutToken> {
        return TransactionRepository.run(async (tx) => {
            const existingIdentity =
                await OAuthIdentityRepository.findByProviderUserId(
                    input.provider,
                    input.providerUserId,
                    tx,
                )

            if (existingIdentity) {
                if (existingIdentity.account.isBanned) {
                    return { user: null, banned: true }
                }

                if (!existingIdentity.account.isActive) {
                    throw Object.assign(new Error('ACCOUNT_INACTIVE'), {
                        status: 403,
                    })
                }

                await UserRepository.updateUser(
                    existingIdentity.accountId,
                    this.getProviderProfileUpdate(input),
                    tx,
                )

                const account =
                    await UserRepository.findByIdWithOAuthIdentities(
                        existingIdentity.accountId,
                        tx,
                    )

                if (!account) {
                    throw Object.assign(new Error('ACCOUNT_NOT_FOUND'), {
                        status: 404,
                    })
                }

                return {
                    user: this.toAuthUser(account),
                    isNewUser: false,
                }
            }

            const account = await UserRepository.create(
                {
                    username: input.username ?? null,
                    firstName: input.firstName ?? null,
                    lastName: input.lastName ?? null,
                    gender: input.gender ?? null,
                    birthDate: input.birthDate ?? null,
                    photoUrl: input.photoUrl ?? null,
                    email: input.email ?? null,
                    emailVerifiedAt: input.emailVerified ? new Date() : null,
                    languageCode: input.languageCode ?? null,
                    status: AccountStatus.REGISTERED,
                },
                tx,
            )

            await OAuthIdentityRepository.create(
                {
                    provider: input.provider,
                    providerUserId: input.providerUserId,
                    account: {
                        connect: { id: account.id },
                    },
                },
                tx,
            )

            const accountWithProviders =
                await UserRepository.findByIdWithOAuthIdentities(account.id, tx)

            if (!accountWithProviders) {
                throw Object.assign(new Error('ACCOUNT_CREATION_FAILED'), {
                    status: 500,
                })
            }

            return {
                user: this.toAuthUser(accountWithProviders),
                isNewUser: true,
            }
        })
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
        const accessToken = this.createAccessToken(result.user)

        return {
            user: result.user,
            accessToken,
            isNewUser: result.isNewUser,
        }
    }

    // Создание JWT токена
    async meUser(accessToken: string): Promise<AuthUser> {
        let payload: jwt.JwtPayload | string

        try {
            payload = jwt.verify(accessToken, config.JWT_SECRET)
        } catch {
            throw Object.assign(new Error('UNAUTHORIZED'), { status: 401 })
        }

        const userId =
            typeof payload === 'string'
                ? undefined
                : typeof payload.sub === 'string'
                  ? payload.sub
                  : typeof payload.id === 'string'
                    ? payload.id
                    : undefined

        if (!userId) {
            throw Object.assign(new Error('UNAUTHORIZED'), { status: 401 })
        }

        const account = await UserRepository.findByIdWithOAuthIdentities(userId)

        if (!account || !account.isActive || account.isBanned) {
            throw Object.assign(new Error('UNAUTHORIZED'), { status: 401 })
        }

        return this.toAuthUser(account)
    }

    private createAccessToken(user: NonNullable<AuthResult['user']>) {
        return jwt.sign(
            {
                id: user.id,
                sub: user.id,
                username: user.username,
                status: user.status,
                providers: user.providers.map(({ provider }) => provider),
            },
            config.JWT_SECRET,
            {
                expiresIn: config.JWT_EXPIRES as SignOptions['expiresIn'],
            } satisfies SignOptions,
        )
    }

    private getProviderProfileUpdate(input: AuthProviderInput) {
        return {
            ...(input.username !== null && input.username !== undefined
                ? { username: input.username }
                : {}),
            ...(input.firstName !== null && input.firstName !== undefined
                ? { firstName: input.firstName }
                : {}),
            ...(input.lastName !== null && input.lastName !== undefined
                ? { lastName: input.lastName }
                : {}),
            ...(input.gender !== null && input.gender !== undefined
                ? { gender: input.gender }
                : {}),
            ...(input.birthDate !== null && input.birthDate !== undefined
                ? { birthDate: input.birthDate }
                : {}),
            ...(input.photoUrl !== null && input.photoUrl !== undefined
                ? { photoUrl: input.photoUrl }
                : {}),
            ...(input.email !== null && input.email !== undefined
                ? { email: input.email }
                : {}),
            ...(input.emailVerified ? { emailVerifiedAt: new Date() } : {}),
            ...(input.languageCode !== null && input.languageCode !== undefined
                ? { languageCode: input.languageCode }
                : {}),
        }
    }

    private toAuthUser(account: {
        id: string
        username: string | null
        firstName: string | null
        lastName: string | null
        gender: Gender | null
        birthDate: Date | null
        photoUrl: string | null
        email: string | null
        emailVerifiedAt: Date | null
        languageCode: string | null
        theme: UserTheme
        status: AccountStatus
        termsAccepted: boolean
        createdAt: Date
        oauthIdentities: Array<{
            provider: string
            providerUserId: string
        }>
    }): AuthUser {
        return {
            id: account.id,
            username: account.username,
            firstName: account.firstName,
            lastName: account.lastName,
            gender: account.gender,
            birthDate: account.birthDate,
            photoUrl: account.photoUrl,
            email: account.email,
            emailVerifiedAt: account.emailVerifiedAt,
            languageCode: account.languageCode,
            theme: account.theme,
            status: account.status,
            termsAccepted: account.termsAccepted,
            createdAt: account.createdAt,
            providers: account.oauthIdentities,
        }
    }

    // private async verifyTurnstileToken(input: {
    //     token: string
    //     remoteIp?: string
    // }): Promise<void> {
    //     const secretKey = config.TURNSTILE_SECRET_KEY

    //     if (!secretKey) {
    //         logger.error('TURNSTILE_SECRET_KEY is not configured')
    //         throw new Error('CAPTCHA_CONFIGURATION_ERROR')
    //     }

    //     const body = new URLSearchParams({
    //         secret: secretKey,
    //         response: input.token,
    //     })

    //     if (input.remoteIp) {
    //         body.set('remoteip', input.remoteIp)
    //     }

    //     let response: Response

    //     try {
    //         response = await fetch(
    //             'https://challenges.cloudflare.com/turnstile/v0/siteverify',
    //             {
    //                 method: 'POST',
    //                 headers: {
    //                     'Content-Type': 'application/x-www-form-urlencoded',
    //                 },
    //                 body,
    //                 signal: AbortSignal.timeout(5000),
    //             },
    //         )
    //     } catch (error) {
    //         logger.error('Turnstile verification request failed', {
    //             error: error instanceof Error ? error.message : 'Unknown error',
    //         })

    //         throw new Error('CAPTCHA_SERVICE_UNAVAILABLE')
    //     }

    //     if (!response.ok) {
    //         logger.error('Turnstile verification returned invalid status', {
    //             status: response.status,
    //         })

    //         throw new Error('CAPTCHA_SERVICE_UNAVAILABLE')
    //     }

    //     const result = (await response.json()) as TurnstileVerifyResponse

    //     if (!result.success) {
    //         logger.warn('Turnstile token verification failed', {
    //             errorCodes: result['error-codes'],
    //             hostname: result.hostname,
    //             action: result.action,
    //         })

    //         throw new Error('CAPTCHA_INVALID')
    //     }

    //     const allowedHostnames =
    //         process.env.NODE_ENV === 'production'
    //             ? ['vwaifu.org', 'www.vwaifu.org']
    //             : ['localhost', '127.0.0.1', 'vwaifu.org']

    //     if (result.hostname && !allowedHostnames.includes(result.hostname)) {
    //         logger.warn('Turnstile hostname mismatch', {
    //             hostname: result.hostname,
    //         })

    //         throw new Error('CAPTCHA_HOSTNAME_INVALID')
    //     }

    //     if (result.action && result.action !== 'email_register') {
    //         logger.warn('Turnstile action mismatch', {
    //             action: result.action,
    //         })

    //         throw new Error('CAPTCHA_ACTION_INVALID')
    //     }
    // }
}

export const authService = new AuthService()
