import { Prisma } from '../generated/prisma/client.js'
import {
    AccountStatus,
    Gender,
    UserTheme,
} from '../generated/prisma/enums.js'
import { prisma } from '../lib/prisma.js'

export interface CreateUserDTO {
    username?: string | null
    firstName?: string | null
    lastName?: string | null
    gender?: Gender | null
    birthDate?: Date | null
    photoUrl?: string | null
    email?: string | null
    emailVerifiedAt?: Date | null
    languageCode?: string | null
    theme?: UserTheme
    status?: AccountStatus
    isBanned?: boolean
    isActive?: boolean
}

export interface UpdateUserDTO {
    username?: string | null
    firstName?: string | null
    lastName?: string | null
    gender?: Gender | null
    birthDate?: Date | null
    photoUrl?: string | null
    email?: string | null
    emailVerifiedAt?: Date | null
    languageCode?: string | null
    theme?: UserTheme
    status?: AccountStatus
    isBanned?: boolean
    isActive?: boolean
}

export interface UpdateUserSettingsDTO {
    firstName?: string | null
    languageCode?: string | null
    theme?: UserTheme
    photoUrl?: string | null
}

export interface AdminUpdateUserDTO extends UpdateUserDTO {}

type GetUsersParams = {
    page?: number
    limit?: number
    search?: string
    isBanned?: boolean
    status?: AccountStatus
}

type TxClient = Prisma.TransactionClient

export class UserRepository {
    private static db(tx?: TxClient) {
        return tx ?? prisma
    }

    static async findById(id: string, tx?: TxClient) {
        return this.db(tx).account.findUnique({
            where: { id },
        })
    }

    static async findByIdWithOAuthIdentities(id: string, tx?: TxClient) {
        return this.db(tx).account.findUnique({
            where: { id },
            include: {
                oauthIdentities: {
                    select: {
                        provider: true,
                        providerUserId: true,
                    },
                },
            },
        })
    }

    static async findByEmail(email: string, tx?: TxClient) {
        return this.db(tx).account.findFirst({
            where: { email },
        })
    }

    static async create(data: CreateUserDTO, tx?: TxClient) {
        return this.db(tx).account.create({
            data,
        })
    }

    static async updateUser(id: string, data: UpdateUserDTO, tx?: TxClient) {
        return this.db(tx).account.update({
            where: { id },
            data,
        })
    }

    static async updateSettings(
        id: string,
        data: UpdateUserSettingsDTO,
        tx?: TxClient,
    ) {
        return this.db(tx).account.update({
            where: { id },
            data,
            select: {
                id: true,
                firstName: true,
                languageCode: true,
                theme: true,
                photoUrl: true,
                updatedAt: true,
            },
        })
    }

    static async acceptTerms(
        userId: string,
        termsVersion?: string,
        tx?: TxClient,
    ) {
        return this.db(tx).account.update({
            where: { id: userId },
            data: {
                termsAccepted: true,
                termsAcceptedAt: new Date(),
                ...(termsVersion !== undefined ? { termsVersion } : {}),
            },
            select: {
                id: true,
                termsAccepted: true,
                termsAcceptedAt: true,
                termsVersion: true,
                updatedAt: true,
            },
        })
    }

    static async getUsers(params: GetUsersParams = {}, tx?: TxClient) {
        const page = Math.max(params.page ?? 1, 1)
        const limit = Math.min(Math.max(params.limit ?? 20, 1), 100)
        const skip = (page - 1) * limit
        const search = params.search?.trim()

        const where: Prisma.AccountWhereInput = {
            ...(params.isBanned !== undefined
                ? { isBanned: params.isBanned }
                : {}),
            ...(params.status !== undefined ? { status: params.status } : {}),
            ...(search
                ? {
                      OR: [
                          {
                              firstName: {
                                  contains: search,
                                  mode: 'insensitive',
                              },
                          },
                          {
                              lastName: {
                                  contains: search,
                                  mode: 'insensitive',
                              },
                          },
                          {
                              username: {
                                  contains: search,
                                  mode: 'insensitive',
                              },
                          },
                          {
                              email: {
                                  contains: search,
                                  mode: 'insensitive',
                              },
                          },
                          ...(isUuid(search) ? [{ id: search }] : []),
                      ],
                  }
                : {}),
        }

        const [users, total] = await Promise.all([
            this.db(tx).account.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                take: limit,
                skip,
            }),
            this.db(tx).account.count({ where }),
        ])

        return {
            users,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        }
    }

    static async deleteUser(id: string, tx?: TxClient) {
        return this.db(tx).account.delete({
            where: { id },
        })
    }

    static async lockById(userId: string, tx: TxClient): Promise<void> {
        await tx.$queryRaw`
            SELECT account_id
            FROM "account"
            WHERE account_id = ${userId}::uuid
            FOR UPDATE
        `
    }
}

function isUuid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        value,
    )
}
