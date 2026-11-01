import { Prisma } from '../../generated/prisma/client.js'
import { prisma } from '../../lib/prisma.js'

type TxClient = Prisma.TransactionClient

export class GroupRepository {
    private static db(tx?: TxClient) {
        return tx ?? prisma
    }

    static async findById(id: string, tx?: TxClient) {
        return this.db(tx).group.findUnique({
            where: { id },
        })
    }

    static async findByIdWithMembers(id: string, tx?: TxClient) {
        return this.db(tx).group.findUnique({
            where: { id },
            include: {
                members: {
                    orderBy: { createdAt: 'asc' },
                    include: {
                        account: {
                            select: {
                                id: true,
                                username: true,
                                firstName: true,
                                lastName: true,
                                photoUrl: true,
                            },
                        },
                    },
                },
            },
        })
    }

    static async findManyByAccountId(accountId: string, tx?: TxClient) {
        return this.db(tx).group.findMany({
            where: {
                members: {
                    some: { accountId },
                },
            },
            include: {
                _count: {
                    select: { members: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        })
    }

    static async create(data: Prisma.GroupCreateInput, tx?: TxClient) {
        return this.db(tx).group.create({ data })
    }

    static async update(
        id: string,
        data: Prisma.GroupUpdateInput,
        tx?: TxClient,
    ) {
        return this.db(tx).group.update({
            where: { id },
            data,
        })
    }

    static async delete(id: string, tx?: TxClient) {
        return this.db(tx).group.delete({
            where: { id },
        })
    }
}
