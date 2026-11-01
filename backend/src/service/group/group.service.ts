import { GroupRole } from '../../generated/prisma/enums.js'
import { TransactionRepository } from '../../repositories/transaction.repository.js'
import { GroupMemberRepository } from '../../repositories/group/groupMember.js'
import { GroupRepository } from '../../repositories/group/group.js'
import { UserRepository } from '../../repositories/user.repository.js'

export class GroupServiceError extends Error {
    constructor(
        message: string,
        public readonly statusCode: number,
    ) {
        super(message)
    }
}

export class GroupService {
    static async listGroups(accountId: string) {
        const groups = await GroupRepository.findManyByAccountId(accountId)

        return groups.map((group) => ({
            id: group.id,
            name: group.name,
            createdAt: group.createdAt,
            membersCount: group._count.members,
        }))
    }

    static async getGroup(accountId: string, groupId: string) {
        await this.requireMembership(accountId, groupId)

        const group = await GroupRepository.findByIdWithMembers(groupId)

        if (!group) {
            throw new GroupServiceError('GROUP_NOT_FOUND', 404)
        }

        return this.toGroupDetails(group)
    }

    static async createGroup(accountId: string, input: { name?: unknown }) {
        const name = this.normalizeName(input.name)
        const account = await UserRepository.findById(accountId)

        if (!account || !account.isActive) {
            throw new GroupServiceError('ACCOUNT_NOT_FOUND', 404)
        }

        if (account.isBanned) {
            throw new GroupServiceError('ACCOUNT_BANNED', 403)
        }

        const displayName = this.getAccountDisplayName(account)

        return TransactionRepository.run(async (tx) => {
            const group = await GroupRepository.create({ name }, tx)

            await GroupMemberRepository.create(
                {
                    displayName,
                    role: GroupRole.OWNER,
                    joinedAt: new Date(),
                    group: { connect: { id: group.id } },
                    account: { connect: { id: accountId } },
                },
                tx,
            )

            const createdGroup = await GroupRepository.findByIdWithMembers(
                group.id,
                tx,
            )

            if (!createdGroup) {
                throw new GroupServiceError('GROUP_CREATION_FAILED', 500)
            }

            return this.toGroupDetails(createdGroup)
        })
    }

    static async updateGroup(
        accountId: string,
        groupId: string,
        input: { name?: unknown },
    ) {
        const member = await this.requireMembership(accountId, groupId)

        if (member.role === GroupRole.MEMBER) {
            throw new GroupServiceError('GROUP_UPDATE_FORBIDDEN', 403)
        }

        const name = this.normalizeName(input.name)
        const group = await GroupRepository.update(groupId, { name })

        return {
            id: group.id,
            name: group.name,
            createdAt: group.createdAt,
        }
    }

    static async deleteGroup(accountId: string, groupId: string) {
        const member = await this.requireMembership(accountId, groupId)

        if (member.role !== GroupRole.OWNER) {
            throw new GroupServiceError('GROUP_DELETE_FORBIDDEN', 403)
        }

        await GroupRepository.delete(groupId)
    }

    static async addMember(
        accountId: string,
        groupId: string,
        input: { accountId?: unknown; displayName?: unknown },
    ) {
        const actor = await this.requireMembership(accountId, groupId)

        if (actor.role === GroupRole.MEMBER) {
            throw new GroupServiceError('GROUP_MEMBER_MANAGEMENT_FORBIDDEN', 403)
        }

        if (typeof input.accountId !== 'string' || !input.accountId) {
            throw new GroupServiceError('ACCOUNT_ID_REQUIRED', 400)
        }

        const [account, existingMember] = await Promise.all([
            UserRepository.findById(input.accountId),
            GroupMemberRepository.findByGroupIdAndAccountId(
                groupId,
                input.accountId,
            ),
        ])

        if (!account || !account.isActive) {
            throw new GroupServiceError('ACCOUNT_NOT_FOUND', 404)
        }

        if (existingMember) {
            throw new GroupServiceError('GROUP_MEMBER_ALREADY_EXISTS', 409)
        }

        const displayName = this.normalizeDisplayName(
            input.displayName,
            this.getAccountDisplayName(account),
        )

        const member = await GroupMemberRepository.create({
            displayName,
            role: GroupRole.MEMBER,
            joinedAt: new Date(),
            group: { connect: { id: groupId } },
            account: { connect: { id: input.accountId } },
        })

        return this.toMember(member)
    }

    static async updateMemberRole(
        accountId: string,
        groupId: string,
        memberId: string,
        input: { role?: unknown },
    ) {
        const actor = await this.requireMembership(accountId, groupId)

        if (actor.role !== GroupRole.OWNER) {
            throw new GroupServiceError('GROUP_ROLE_UPDATE_FORBIDDEN', 403)
        }

        if (input.role !== GroupRole.ADMIN && input.role !== GroupRole.MEMBER) {
            throw new GroupServiceError('INVALID_GROUP_ROLE', 400)
        }

        const member = await GroupMemberRepository.findById(memberId)

        if (!member || member.groupId !== groupId) {
            throw new GroupServiceError('GROUP_MEMBER_NOT_FOUND', 404)
        }

        if (member.role === GroupRole.OWNER) {
            throw new GroupServiceError('OWNER_ROLE_CANNOT_BE_CHANGED', 409)
        }

        const updatedMember = await GroupMemberRepository.updateRole(
            member.id,
            input.role,
        )

        return this.toMember(updatedMember)
    }

    static async removeMember(
        accountId: string,
        groupId: string,
        memberId: string,
    ) {
        const actor = await this.requireMembership(accountId, groupId)
        const member = await GroupMemberRepository.findById(memberId)

        if (!member || member.groupId !== groupId) {
            throw new GroupServiceError('GROUP_MEMBER_NOT_FOUND', 404)
        }

        const isSelfRemoval = member.accountId === accountId

        if (member.role === GroupRole.OWNER) {
            throw new GroupServiceError('GROUP_OWNER_CANNOT_BE_REMOVED', 409)
        }

        if (!isSelfRemoval && actor.role === GroupRole.MEMBER) {
            throw new GroupServiceError('GROUP_MEMBER_MANAGEMENT_FORBIDDEN', 403)
        }

        if (!isSelfRemoval && member.role === GroupRole.ADMIN) {
            if (actor.role !== GroupRole.OWNER) {
                throw new GroupServiceError(
                    'GROUP_MEMBER_MANAGEMENT_FORBIDDEN',
                    403,
                )
            }
        }

        await GroupMemberRepository.delete(memberId)
    }

    private static async requireMembership(accountId: string, groupId: string) {
        const member = await GroupMemberRepository.findByGroupIdAndAccountId(
            groupId,
            accountId,
        )

        if (!member) {
            throw new GroupServiceError('GROUP_ACCESS_FORBIDDEN', 403)
        }

        return member
    }

    private static normalizeName(value: unknown): string {
        if (typeof value !== 'string') {
            throw new GroupServiceError('GROUP_NAME_REQUIRED', 400)
        }

        const name = value.trim()

        if (!name || name.length > 150) {
            throw new GroupServiceError('INVALID_GROUP_NAME', 400)
        }

        return name
    }

    private static normalizeDisplayName(value: unknown, fallback: string): string {
        if (value === undefined || value === null) {
            return fallback
        }

        if (typeof value !== 'string') {
            throw new GroupServiceError('INVALID_DISPLAY_NAME', 400)
        }

        const displayName = value.trim()

        if (!displayName || displayName.length > 100) {
            throw new GroupServiceError('INVALID_DISPLAY_NAME', 400)
        }

        return displayName
    }

    private static getAccountDisplayName(account: {
        username: string | null
        firstName: string | null
        lastName: string | null
    }): string {
        const fullName = [account.firstName, account.lastName]
            .filter((value): value is string => Boolean(value?.trim()))
            .join(' ')
            .trim()

        return fullName || account.username?.trim() || 'Member'
    }

    private static toGroupDetails(group: Awaited<
        ReturnType<typeof GroupRepository.findByIdWithMembers>
    > extends infer T
        ? NonNullable<T>
        : never) {
        return {
            id: group.id,
            name: group.name,
            createdAt: group.createdAt,
            members: group.members.map((member) => ({
                ...this.toMember(member),
                account: member.account
                    ? {
                          id: member.account.id,
                          username: member.account.username,
                          firstName: member.account.firstName,
                          lastName: member.account.lastName,
                          photoUrl: member.account.photoUrl,
                      }
                    : null,
            })),
        }
    }

    private static toMember(member: {
        id: string
        accountId: string | null
        displayName: string
        role: GroupRole
        joinedAt: Date | null
        createdAt: Date
    }) {
        return {
            id: member.id,
            accountId: member.accountId,
            displayName: member.displayName,
            role: member.role,
            joinedAt: member.joinedAt,
            createdAt: member.createdAt,
        }
    }
}
