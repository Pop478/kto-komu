import { Prisma } from '../generated/prisma/client.js'
import { UserRole, UserTheme } from '../generated/prisma/enums.js'
import { prisma } from '../lib/prisma.js'
import { isNumeric, isUuid } from '../utils/validators.js'

export interface CreateUserDTO {
    telegramId: bigint
    username: string | null
    first_name: string | null
    last_name: string | null
    is_premium: boolean
    languageCode: string | null
    photo_url: string | null
    refCode?: string
    telegramBotId?: string
}

export interface UpdateUserDTO {
    id: string
    username: string | null
    first_name: string | null
    last_name: string | null
    is_premium: boolean
    languageCode: string | null
    // photo_url?: string | null
}

export interface UpdateUserSettingsDTO {
    id: string
    first_name?: string | null
    languageCode?: string | null
    theme?: UserTheme
    photo_url?: string | null
}

export interface AdminUpdateUserDTO {
    username?: string | null
    first_name?: string | null
    last_name?: string | null
    languageCode?: string | null
    photo_url?: string | null
    is_premium?: boolean
    role?: UserRole
    theme?: UserTheme
    isBanned?: boolean
    ban?: boolean
    is_active?: boolean
}

type GetUsersParams = {
    page?: number
    limit?: number
    search?: string
    isBanned?: boolean
    role?: 'user' | 'admin'
}

type TxClient = Prisma.TransactionClient

export class UserRepository {
    private static db(tx?: TxClient) {
        return tx ?? prisma
    }

    static async findByTelegramId(telegramId: bigint, tx?: TxClient) {
        return this.db(tx).users.findUnique({
            where: { telegramId },
        })
    }

    static async findById(id: string, tx?: TxClient) {
        return this.db(tx).users.findUnique({
            where: { id },
            include: {
                settings: true,
            },
        })
    }

    static async findByIdWithProfile(id: string, tx?: TxClient) {
        return this.db(tx).users.findUnique({
            where: { id },
            include: { profile: true },
        })
    }

    static async create(data: CreateUserDTO, tx?: TxClient) {
        return this.db(tx).users.create({
            data: {
                telegramId: data.telegramId,
                username: data.username,
                first_name: data.first_name,
                last_name: data.last_name,
                is_premium: data.is_premium,
                languageCode: data.languageCode,
                photo_url: data.photo_url,
                role: UserRole.user,
                registeredFromBotId: data.telegramBotId,
                settings: {
                    create: {},
                },
            },
            include: {
                settings: true,
            },
        })
    }

    static async updateTelegramData(data: UpdateUserDTO, tx?: TxClient) {
        return this.db(tx).users.update({
            where: { id: data.id },
            data: {
                username: data.username ?? undefined,
                first_name: data.first_name ?? undefined,
                last_name: data.last_name ?? undefined,
                // languageCode: data.languageCode ?? undefined,
                is_premium: data.is_premium ?? undefined,
                // photo_url: data.photo_url?.trim() || undefined,

                is_active: true,
            },
            include: {
                settings: true,
            },
        })
    }

    static async updateSettings(data: UpdateUserSettingsDTO, tx?: TxClient) {
        return this.db(tx).users.update({
            where: {
                id: data.id,
            },
            data: {
                first_name:
                    data.first_name !== undefined ? data.first_name : undefined,
                languageCode:
                    data.languageCode !== undefined
                        ? data.languageCode
                        : undefined,

                theme: data.theme !== undefined ? data.theme : undefined,
                photo_url:
                    data.photo_url !== undefined ? data.photo_url : undefined,
            },
            select: {
                id: true,
                first_name: true,
                languageCode: true,
                theme: true,
                photo_url: true,
                updatedAt: true,
            },
        })
    }

    static async acceptTerms(userId: string, tx?: TxClient) {
        return this.db(tx).users.update({
            where: {
                id: userId,
            },
            data: {
                termsAccepted: true,
            },
            select: {
                id: true,
                termsAccepted: true,
                updatedAt: true,
            },
        })
    }
    // Получение пользователей
    static async getUsers(params: GetUsersParams = {}, tx?: TxClient) {
        const page = params.page ?? 1
        const limit = Math.min(params.limit ?? 20, 100)
        const skip = (page - 1) * limit

        const search = params.search?.trim()

        const where: Prisma.UsersWhereInput = {
            ...(params.isBanned !== undefined ? { ban: params.isBanned } : {}),
            ...(params.role ? { role: params.role } : {}),

            ...(search
                ? {
                      OR: [
                          {
                              first_name: {
                                  contains: search,
                                  mode: 'insensitive',
                              },
                          },
                          {
                              last_name: {
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
                          ...(isUuid(search)
                              ? [
                                    {
                                        id: search,
                                    },
                                ]
                              : []),
                          ...(isNumeric(search)
                              ? [
                                    {
                                        telegramId: BigInt(search),
                                    },
                                ]
                              : []),
                      ],
                  }
                : {}),
        }

        const [users, total] = await Promise.all([
            this.db(tx).users.findMany({
                where,
                orderBy: {
                    createdAt: 'desc',
                },
                take: limit,
                skip,
            }),

            this.db(tx).users.count({ where }),
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

    static async updateUser(
        id: string,
        data: AdminUpdateUserDTO,
        tx?: TxClient,
    ) {
        const existing = await this.findById(id, tx)

        if (!existing) {
            throw new Error('User not found')
        }

        return this.db(tx).users.update({
            where: {
                id,
            },
            data: {
                ...(data.username !== undefined
                    ? { username: data.username }
                    : {}),
                ...(data.first_name !== undefined
                    ? { first_name: data.first_name }
                    : {}),
                ...(data.last_name !== undefined
                    ? { last_name: data.last_name }
                    : {}),
                ...(data.languageCode !== undefined
                    ? { languageCode: data.languageCode }
                    : {}),
                ...(data.photo_url !== undefined
                    ? { photo_url: data.photo_url }
                    : {}),
                ...(data.is_premium !== undefined
                    ? { is_premium: data.is_premium }
                    : {}),
                ...(data.role !== undefined ? { role: data.role } : {}),
                ...(data.theme !== undefined ? { theme: data.theme } : {}),
                ...(data.isBanned !== undefined ? { ban: data.isBanned } : {}),
                ...(data.ban !== undefined ? { ban: data.ban } : {}),
                ...(data.is_active !== undefined
                    ? { is_active: data.is_active }
                    : {}),
            },
        })
    }

    static async deleteUser(id: string, tx?: TxClient) {
        const existing = await this.findById(id, tx)

        if (!existing) {
            throw new Error('User not found')
        }

        return this.db(tx).users.delete({
            where: {
                id,
            },
        })
    }

    static async findAllBotUsers(tx?: TxClient) {
        return this.db(tx).users.findMany({
            where: {
                telegramId: {
                    not: null,
                },
            },
            select: {
                id: true,
                telegramId: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        })
    }

    static async lockById(userId: string, tx: TxClient): Promise<void> {
        await tx.$queryRaw`
        SELECT id
        FROM "Users"
        WHERE id = ${userId}
        FOR UPDATE
    `
    }
}
