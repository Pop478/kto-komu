import { Prisma } from '../../generated/prisma/client.js'
import { GroupRole } from '../../generated/prisma/enums.js'
import { prisma } from '../../lib/prisma.js'

type TxClient = Prisma.TransactionClient

export class GroupMemberRepository {
    private static db(tx?: TxClient) {
        return tx ?? prisma
    }

    static async findById(id: string, tx?: TxClient) {
        return this.db(tx).groupMember.findUnique({
            where: { id },
        })
    }

    static async findByIdWithRelations(id: string, tx?: TxClient) {
        return this.db(tx).groupMember.findUnique({
            where: { id },
            include: {
                group: true,
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
        })
    }

    static async findByGroupId(groupId: string, tx?: TxClient) {
        return this.db(tx).groupMember.findMany({
            where: { groupId },
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
            orderBy: { createdAt: 'asc' },
        })
    }

    static async findByGroupIdAndAccountId(
        groupId: string,
        accountId: string,
        tx?: TxClient,
    ) {
        return this.db(tx).groupMember.findFirst({
            where: {
                groupId,
                accountId,
            },
        })
    }

    static async findManyByAccountId(accountId: string, tx?: TxClient) {
        return this.db(tx).groupMember.findMany({
            where: { accountId },
            include: {
                group: true,
            },
            orderBy: { createdAt: 'desc' },
        })
    }

    static async create(
        data: Prisma.GroupMemberCreateInput,
        tx?: TxClient,
    ) {
        return this.db(tx).groupMember.create({ data })
    }

    static async update(
        id: string,
        data: Prisma.GroupMemberUpdateInput,
        tx?: TxClient,
    ) {
        return this.db(tx).groupMember.update({
            where: { id },
            data,
        })
    }

    static async updateRole(
        id: string,
        role: GroupRole,
        tx?: TxClient,
    ) {
        return this.db(tx).groupMember.update({
            where: { id },
            data: { role },
        })
    }

    static async delete(id: string, tx?: TxClient) {
        return this.db(tx).groupMember.delete({
            where: { id },
        })
    }
}
