import {
    AdTaskStatus,
    PaymentCurrency,
    Prisma,
} from '../../generated/prisma/client.js'
import { prisma } from '../../lib/prisma.js'
import { ExchangeRatesService } from '../currency/exchangeRates.js'

export type StatsUnit = 'day' | 'week' | 'month'

type GetUserStatsInput = {
    from?: string
    toExclusive?: string
    unit?: StatsUnit
    registeredFromBotId?: string
    includeBanned?: boolean
}

type ChartRow = {
    bucket: Date | string
    count: number | bigint
}

const DAY_MS = 24 * 60 * 60 * 1000

const DEFAULT_CHART_DAYS = 30

function paymentAmountToRub(
    payment: {
        amount: number
        currency: PaymentCurrency
    },
    rates: {
        usdToRub: number
        tonToRub: number
        starsToRub: number
    },
) {
    switch (payment.currency) {
        case PaymentCurrency.RUB:
            return payment.amount / 100

        case PaymentCurrency.USD:
            return (payment.amount / 100) * rates.usdToRub

        case PaymentCurrency.TON:
            return (payment.amount / 1_000_000) * rates.tonToRub

        case PaymentCurrency.XTR:
            return payment.amount * rates.starsToRub

        default:
            return 0
    }
}

export class StatsAdminService {
    static async getOverviewStats() {
        const now = new Date()

        const dayAgo = new Date(now.getTime() - DAY_MS)
        const weekAgo = new Date(now.getTime() - 7 * DAY_MS)
        const monthAgo = new Date(now.getTime() - 30 * DAY_MS)

        const [
            totalUsers,
            dau,
            wau,
            mau,

            totalMessages,
            userMessages,
            assistantMessages,
            regeneratedMessages,

            tokenBuyersCount,
            tokenBuyers,
            characters,
            scenarios,
            usersAtZero,
            userAdTaskCount,
        ] = await Promise.all([
            prisma.users.count(),

            prisma.users.count({
                where: {
                    updatedAt: {
                        gte: dayAgo,
                        lt: now,
                    },
                },
            }),

            prisma.users.count({
                where: {
                    updatedAt: {
                        gte: weekAgo,
                        lt: now,
                    },
                },
            }),

            prisma.users.count({
                where: {
                    updatedAt: {
                        gte: monthAgo,
                        lt: now,
                    },
                },
            }),

            // Всего сообщений
            prisma.chatMessage.count(),

            // Сообщения пользователя
            prisma.chatMessage.count({
                where: {
                    userId: {
                        not: null,
                    },
                },
            }),

            // Сообщения ИИ
            prisma.chatMessage.count({
                where: {
                    userId: null,
                },
            }),

            // Перегенерированные сообщения ИИ
            prisma.chatMessage.count({
                where: {
                    userId: null,
                    variantIndex: {
                        not: 1,
                    },
                },
            }),

            // Всего рокупок токенов
            prisma.userBalancePayment.count({
                where: {
                    status: 'paid',
                },
            }),
            // Покупок пользователй
            prisma.userBalancePayment.findMany({
                where: {
                    status: 'paid',
                },
                select: {
                    amount: true,
                    currency: true,
                    method: true,
                },
            }),

            // всего персонажей
            prisma.character.count(),
            // всего сценариев
            prisma.scenario.count(),
            // пользователй с 0 балансом
            prisma.userBalance.count({
                where: {
                    balance: {
                        lte: 0,
                    },
                },
            }),
            // выполненных заданий
            prisma.userAdTask.count({
                where: {
                    status: AdTaskStatus.complete,
                },
            }),
        ])
        // Курсы
        const rates = await ExchangeRatesService.getRates()

        const revenueByMethod = {
            stars: 0,
            platega: 0,
            cryptobot: 0,
            ton: 0,
        }

        for (const payment of tokenBuyers) {
            let amountRub = 0

            switch (payment.currency) {
                case 'RUB':
                    amountRub = payment.amount / 100
                    break

                case 'USD':
                    amountRub = (payment.amount / 100) * rates.usdToRub
                    break

                case 'TON':
                    amountRub = payment.amount * rates.tonToRub
                    break

                case 'XTR':
                    amountRub = payment.amount * 0.015 * rates.usdToRub
                    break
            }

            revenueByMethod[payment.method] += amountRub
        }

        const totalRevenueRub =
            revenueByMethod.stars +
            revenueByMethod.platega +
            revenueByMethod.cryptobot +
            revenueByMethod.ton

        const conversion = (tokenBuyersCount / totalUsers) * 100

        const messagesPerUser =
            totalUsers > 0 ? round(userMessages / totalUsers, 1) : 0

        const assistantMessagesPerUser =
            totalUsers > 0 ? round(assistantMessages / totalUsers, 1) : 0

        const d1 = await this.getRetentionPercent(1)
        const d7 = await this.getRetentionPercent(7)

        return {
            summary: {
                totalUsers,
                dau,
                wau,
                mau,
                totalMessages,
                userMessages,
                assistantMessages,
                regeneratedMessages,
                tokenConversion: conversion,
                totalRevenueRub: round(totalRevenueRub, 2),
                revenueByMethodRub: {
                    stars: round(revenueByMethod.stars, 2),
                    platega: round(revenueByMethod.platega, 2),
                    cryptobot: round(revenueByMethod.cryptobot, 2),
                    ton: round(revenueByMethod.ton, 2),
                },
                characters,
                scenarios,
                d1,
                d7,
                messagesPerUser,
                assistantMessagesPerUser,
                usersAtZero,
                userAdTaskCount,
            },
        }
    }

    private static async getRetentionPercent(days: number) {
        const now = new Date()

        const cohortStart = startOfDayUtc(
            new Date(now.getTime() - days * DAY_MS),
        )
        const cohortEnd = startOfDayUtc(
            new Date(now.getTime() - (days - 1) * DAY_MS),
        )

        const cohortUsers = await prisma.users.findMany({
            where: {
                createdAt: {
                    gte: cohortStart,
                    lt: cohortEnd,
                },
            },
            select: {
                id: true,
                updatedAt: true,
            },
        })

        if (cohortUsers.length === 0) {
            return 0
        }

        const returnedUsers = cohortUsers.filter(
            (user) => user.updatedAt >= cohortEnd,
        ).length

        return round((returnedUsers / cohortUsers.length) * 100, 1)
    }

    static async getUsersStats(input: GetUserStatsInput = {}) {
        const now = new Date()

        const unit = input.unit ?? 'day'

        const toExclusive = input.toExclusive
            ? parseDate(input.toExclusive, true)
            : now

        const from = input.from
            ? parseDate(input.from)
            : new Date(now.getTime() - DEFAULT_CHART_DAYS * DAY_MS)

        if (
            Number.isNaN(from.getTime()) ||
            Number.isNaN(toExclusive.getTime())
        ) {
            throw new Error('INVALID_DATE')
        }

        if (from >= toExclusive) {
            throw new Error('DATE_RANGE_INVALID')
        }

        const includeBanned = input.includeBanned ?? false

        const usersWhere: Prisma.UsersWhereInput = {
            ...(includeBanned ? {} : { ban: false }),
            ...(input.registeredFromBotId
                ? { registeredFromBotId: input.registeredFromBotId }
                : {}),
        }

        const usersWhereSql = Prisma.sql`
            ${includeBanned ? Prisma.empty : Prisma.sql`u."ban" = false`}
            ${
                !includeBanned && input.registeredFromBotId
                    ? Prisma.sql`AND`
                    : Prisma.empty
            }
            ${
                input.registeredFromBotId
                    ? Prisma.sql`u."registeredFromBotId" = ${input.registeredFromBotId}`
                    : Prisma.empty
            }
            ${
                includeBanned && !input.registeredFromBotId
                    ? Prisma.sql`TRUE`
                    : Prisma.empty
            }
        `

        const todayStart = startOfDayUtc(now)
        const weekAgo = new Date(now.getTime() - 7 * DAY_MS)
        const monthAgo = new Date(now.getTime() - 30 * DAY_MS)

        const [
            totalUsers,
            newToday,
            newWeek,
            newMonth,
            dau,
            wau,
            mau,
            newUsersChartRows,
            activeUsersChartRows,
        ] = await Promise.all([
            prisma.users.count({
                where: usersWhere,
            }),

            prisma.users.count({
                where: {
                    ...usersWhere,
                    createdAt: {
                        gte: todayStart,
                    },
                },
            }),

            prisma.users.count({
                where: {
                    ...usersWhere,
                    createdAt: {
                        gte: weekAgo,
                    },
                },
            }),

            prisma.users.count({
                where: {
                    ...usersWhere,
                    createdAt: {
                        gte: monthAgo,
                    },
                },
            }),

            this.countActiveUsers(
                usersWhere,
                new Date(now.getTime() - DAY_MS),
                now,
            ),

            this.countActiveUsers(usersWhere, weekAgo, now),

            this.countActiveUsers(usersWhere, monthAgo, now),

            this.getNewUsersChartRows({
                from,
                toExclusive,
                unit,
                usersWhereSql,
            }),

            this.getActiveUsersChartRows({
                from,
                toExclusive,
                unit,
                usersWhereSql,
            }),
        ])

        const chart = buildChart({
            from,
            toExclusive,
            unit,
            newUsersRows: newUsersChartRows,
            activeUsersRows: activeUsersChartRows,
        })

        return {
            summary: {
                totalUsers,
                newToday,
                newWeek,
                newMonth,
                dau,
                wau,
                mau,
                dauMauRatio: mau > 0 ? round((dau / mau) * 100, 1) : 0,
            },

            range: {
                from: from.toISOString(),
                toExclusive: toExclusive.toISOString(),
                unit,
            },

            chart,
        }
    }

    static async getTokensStats() {
        const rows = await prisma.userBalanceTransaction.groupBy({
            by: ['type', 'direction'],
            _sum: {
                amount: true,
            },
        })

        let issuedTokens = 0
        let spentTokens = 0
        let boughtTokens = 0
        let rewardTokens = 0
        let taskTokens = 0
        let registrationTokens = 0

        const rewardTypes = [
            'registration_bonus',
            'daily_reward',
            'promo_code',
            'referral_reward',
            'subscription_bonus',
            'admin_credit',
        ]

        for (const row of rows) {
            const amount = row._sum.amount ?? 0

            if (row.direction === 'credit') {
                issuedTokens += amount
            }

            if (row.direction === 'debit') {
                spentTokens += amount
            }

            if (row.direction === 'credit' && row.type === 'top_up') {
                boughtTokens += amount
            }

            if (row.direction === 'credit' && row.type === 'task_reward') {
                taskTokens += amount
            }

            if (row.direction === 'credit' && row.type === 'registration') {
                registrationTokens += amount
            }

            if (row.direction === 'credit' && rewardTypes.includes(row.type)) {
                rewardTokens += amount
            }
        }

        return {
            summary: {
                issuedTokens,
                spentTokens,
                boughtTokens,
                rewardTokens,
                taskTokens,
                registrationTokens,
            },
        }
    }

    static async getMonetizationStats() {
        const now = new Date()

        const todayStart = startOfDayUtc(now)
        const weekAgo = new Date(now.getTime() - 7 * DAY_MS)
        const monthAgo = new Date(now.getTime() - 30 * DAY_MS)

        const [
            totalUsers,

            tokenToday,
            tokenWeek,
            tokenMonth,
            tokenAll,
            tokenBuyers,
            tokenOrders,

            subscriptionToday,
            subscriptionWeek,
            subscriptionMonth,
            subscriptionAll,
            subscriptionBuyers,
            subscriptionOrders,
        ] = await Promise.all([
            prisma.users.count(),

            this.getTokenRevenue(todayStart, now),
            this.getTokenRevenue(weekAgo, now),
            this.getTokenRevenue(monthAgo, now),
            this.getTokenRevenue(),
            this.getTokenBuyers(),
            this.getTokenOrders(),

            this.getSubscriptionRevenue(todayStart, now),
            this.getSubscriptionRevenue(weekAgo, now),
            this.getSubscriptionRevenue(monthAgo, now),
            this.getSubscriptionRevenue(),
            this.getSubscriptionBuyers(),
            this.getSubscriptionOrders(),
        ])

        const totalRevenue = tokenAll + subscriptionAll
        const totalBuyers = await this.getTotalBuyers()
        const totalOrders = tokenOrders + subscriptionOrders

        return {
            summary: {
                total: buildMonetizationSummary({
                    totalUsers,
                    revenueToday: tokenToday + subscriptionToday,
                    revenueWeek: tokenWeek + subscriptionWeek,
                    revenueMonth: tokenMonth + subscriptionMonth,
                    revenueAll: totalRevenue,
                    buyers: totalBuyers,
                    orders: totalOrders,
                }),

                tokens: buildMonetizationSummary({
                    totalUsers,
                    revenueToday: tokenToday,
                    revenueWeek: tokenWeek,
                    revenueMonth: tokenMonth,
                    revenueAll: tokenAll,
                    buyers: tokenBuyers,
                    orders: tokenOrders,
                }),

                subscriptions: buildMonetizationSummary({
                    totalUsers,
                    revenueToday: subscriptionToday,
                    revenueWeek: subscriptionWeek,
                    revenueMonth: subscriptionMonth,
                    revenueAll: subscriptionAll,
                    buyers: subscriptionBuyers,
                    orders: subscriptionOrders,
                }),
            },
        }
    }

    private static async getTokenRevenue(from?: Date, to?: Date) {
        const result = await prisma.userBalancePayment.aggregate({
            where: {
                status: 'paid',
                paidAt: {
                    ...(from ? { gte: from } : {}),
                    ...(to ? { lt: to } : {}),
                },
            },
            _sum: {
                amount: true,
            },
        })

        return result._sum.amount ?? 0
    }

    private static async getTokenBuyers() {
        const buyers = await prisma.userBalancePayment.findMany({
            where: {
                status: 'paid',
            },
            distinct: ['userId'],
            select: {
                userId: true,
            },
        })

        return buyers.length
    }

    private static async getTokenOrders() {
        return prisma.userBalancePayment.count({
            where: {
                status: 'paid',
            },
        })
    }

    private static async getSubscriptionRevenue(from?: Date, to?: Date) {
        const result = await prisma.subscriptionOrder.aggregate({
            where: {
                status: 'PAID',
                paidAt: {
                    ...(from ? { gte: from } : {}),
                    ...(to ? { lt: to } : {}),
                },
            },
            _sum: {
                amount: true,
            },
        })

        return Number(result._sum.amount ?? 0)
    }

    private static async getSubscriptionBuyers() {
        const buyers = await prisma.subscriptionOrder.findMany({
            where: {
                status: 'PAID',
            },
            distinct: ['userId'],
            select: {
                userId: true,
            },
        })

        return buyers.length
    }

    private static async getSubscriptionOrders() {
        return prisma.subscriptionOrder.count({
            where: {
                status: 'PAID',
            },
        })
    }

    private static async getTotalBuyers() {
        const [tokenBuyers, subscriptionBuyers] = await Promise.all([
            prisma.userBalancePayment.findMany({
                where: {
                    status: 'paid',
                },
                distinct: ['userId'],
                select: {
                    userId: true,
                },
            }),

            prisma.subscriptionOrder.findMany({
                where: {
                    status: 'PAID',
                },
                distinct: ['userId'],
                select: {
                    userId: true,
                },
            }),
        ])

        const ids = new Set<string>()

        for (const buyer of tokenBuyers) {
            ids.add(buyer.userId)
        }

        for (const buyer of subscriptionBuyers) {
            ids.add(buyer.userId)
        }

        return ids.size
    }

    private static async countActiveUsers(
        usersWhere: Prisma.UsersWhereInput,
        from: Date,
        toExclusive: Date,
    ): Promise<number> {
        return prisma.users.count({
            where: {
                ...usersWhere,
                updatedAt: {
                    gte: from,
                    lt: toExclusive,
                },
            },
        })
    }

    private static async getNewUsersChartRows(input: {
        from: Date
        toExclusive: Date
        unit: StatsUnit
        usersWhereSql: Prisma.Sql
    }): Promise<ChartRow[]> {
        return prisma.$queryRaw<ChartRow[]>(Prisma.sql`
            SELECT
                date_trunc(${input.unit}, u."createdAt")::date AS bucket,
                COUNT(*)::int AS count
            FROM "Users" u
            WHERE ${input.usersWhereSql}
              AND u."createdAt" >= ${input.from}
              AND u."createdAt" < ${input.toExclusive}
            GROUP BY bucket
            ORDER BY bucket ASC
        `)
    }

    private static async getActiveUsersChartRows(input: {
        from: Date
        toExclusive: Date
        unit: StatsUnit
        usersWhereSql: Prisma.Sql
    }): Promise<ChartRow[]> {
        return prisma.$queryRaw<ChartRow[]>(Prisma.sql`
            SELECT
                date_trunc(${input.unit}, u."updatedAt")::date AS bucket,
                COUNT(*)::int AS count
            FROM "Users" u
            WHERE ${input.usersWhereSql}
              AND u."updatedAt" >= ${input.from}
              AND u."updatedAt" < ${input.toExclusive}
            GROUP BY bucket
            ORDER BY bucket ASC
        `)
    }
}

function parseDate(value: string, endOfDay = false) {
    const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value)

    const date = new Date(isDateOnly ? `${value}T00:00:00.000Z` : value)

    if (endOfDay && isDateOnly) {
        date.setUTCDate(date.getUTCDate() + 1)
    }

    return date
}

function buildChart(input: {
    from: Date
    toExclusive: Date
    unit: StatsUnit
    newUsersRows: ChartRow[]
    activeUsersRows: ChartRow[]
}) {
    const start = startOfUnitUtc(input.from, input.unit)

    const newUsersMap = rowsToMap(input.newUsersRows)
    const activeUsersMap = rowsToMap(input.activeUsersRows)

    const result: {
        date: string
        newUsers: number
        activeUsers: number
    }[] = []

    let cursor = start

    while (cursor < input.toExclusive) {
        const key = dateKey(cursor)

        result.push({
            date: key,
            newUsers: newUsersMap.get(key) ?? 0,
            activeUsers: activeUsersMap.get(key) ?? 0,
        })

        cursor = addUnitUtc(cursor, input.unit)
    }

    return result
}

function rowsToMap(rows: ChartRow[]) {
    const map = new Map<string, number>()

    for (const row of rows) {
        const key = dateKey(new Date(row.bucket))
        map.set(key, toNumber(row.count))
    }

    return map
}

function startOfUnitUtc(date: Date, unit: StatsUnit) {
    if (unit === 'month') {
        return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1))
    }

    if (unit === 'week') {
        const day = date.getUTCDay() || 7
        const start = startOfDayUtc(date)
        start.setUTCDate(start.getUTCDate() - day + 1)
        return start
    }

    return startOfDayUtc(date)
}

function addUnitUtc(date: Date, unit: StatsUnit) {
    const next = new Date(date)

    if (unit === 'month') {
        next.setUTCMonth(next.getUTCMonth() + 1)
        return next
    }

    if (unit === 'week') {
        next.setUTCDate(next.getUTCDate() + 7)
        return next
    }

    next.setUTCDate(next.getUTCDate() + 1)
    return next
}

function startOfDayUtc(date: Date) {
    return new Date(
        Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
    )
}

function dateKey(date: Date) {
    return date.toISOString().slice(0, 10)
}

function toNumber(value: unknown) {
    if (typeof value === 'bigint') return Number(value)
    if (typeof value === 'number') return value
    return Number(value ?? 0)
}

function round(value: number, digits: number) {
    const multiplier = 10 ** digits
    return Math.round(value * multiplier) / multiplier
}

function buildMonetizationSummary(input: {
    totalUsers: number
    revenueToday: number
    revenueWeek: number
    revenueMonth: number
    revenueAll: number
    buyers: number
    orders: number
}) {
    return {
        revenueToday: input.revenueToday,
        revenueWeek: input.revenueWeek,
        revenueMonth: input.revenueMonth,
        revenueAll: input.revenueAll,

        buyers: input.buyers,
        orders: input.orders,

        conversion:
            input.totalUsers > 0
                ? round((input.buyers / input.totalUsers) * 100, 1)
                : 0,

        averageCheck:
            input.orders > 0 ? round(input.revenueAll / input.orders, 1) : 0,

        arpu:
            input.totalUsers > 0
                ? round(input.revenueAll / input.totalUsers, 1)
                : 0,

        arppu: input.buyers > 0 ? round(input.revenueAll / input.buyers, 1) : 0,
    }
}
