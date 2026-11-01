import { create } from 'zustand'
import {
    ApiError,
    GroupsService,
    type Group,
    type GroupAddMemberRequest,
    type GroupCreateRequest,
    type GroupSummary,
    type GroupUpdateMemberRoleRequest,
    type GroupUpdateRequest,
} from '../api'

const errorMessage = (error: unknown) => {
    if (error instanceof ApiError) {
        return typeof error.body?.error === 'string' ? error.body.error : error.message
    }
    return error instanceof Error ? error.message : 'Не удалось выполнить запрос'
}

const toSummary = (group: Group): GroupSummary => ({
    id: group.id,
    name: group.name,
    createdAt: group.createdAt,
    membersCount: group.members.length,
})

export type GroupStore = {
    groups: GroupSummary[]
    currentGroup: Group | null
    loading: boolean
    submitting: boolean
    error: string | null
    fetchGroups: () => Promise<void>
    fetchGroup: (groupId: string) => Promise<Group | null>
    createGroup: (data: GroupCreateRequest) => Promise<Group | null>
    updateGroup: (groupId: string, data: GroupUpdateRequest) => Promise<boolean>
    deleteGroup: (groupId: string) => Promise<boolean>
    addMember: (groupId: string, data: GroupAddMemberRequest) => Promise<boolean>
    updateMemberRole: (groupId: string, memberId: string, data: GroupUpdateMemberRoleRequest) => Promise<boolean>
    removeMember: (groupId: string, memberId: string) => Promise<boolean>
    clearCurrentGroup: () => void
    clearError: () => void
}

export const useGroupStore = create<GroupStore>((set, get) => ({
    groups: [],
    currentGroup: null,
    loading: false,
    submitting: false,
    error: null,

    fetchGroups: async () => {
        set({ loading: true, error: null })
        try {
            const response = await GroupsService.listGroups()
            set({ groups: response.groups, loading: false })
        } catch (error) {
            set({ loading: false, error: errorMessage(error) })
        }
    },

    fetchGroup: async (groupId) => {
        set({ loading: true, error: null, currentGroup: null })
        try {
            const response = await GroupsService.getGroup(groupId)
            set({ currentGroup: response.group, loading: false })
            return response.group
        } catch (error) {
            set({ loading: false, error: errorMessage(error) })
            return null
        }
    },

    createGroup: async (data) => {
        set({ submitting: true, error: null })
        try {
            const response = await GroupsService.createGroup(data)
            set((state) => ({
                groups: [toSummary(response.group), ...state.groups],
                currentGroup: response.group,
                submitting: false,
            }))
            return response.group
        } catch (error) {
            set({ submitting: false, error: errorMessage(error) })
            return null
        }
    },

    updateGroup: async (groupId, data) => {
        set({ submitting: true, error: null })
        try {
            const response = await GroupsService.updateGroup(groupId, data)
            set((state) => ({
                groups: state.groups.map((group) => group.id === groupId ? response.group : group),
                currentGroup: state.currentGroup?.id === groupId ? { ...state.currentGroup, name: response.group.name } : state.currentGroup,
                submitting: false,
            }))
            return true
        } catch (error) {
            set({ submitting: false, error: errorMessage(error) })
            return false
        }
    },

    deleteGroup: async (groupId) => {
        set({ submitting: true, error: null })
        try {
            await GroupsService.deleteGroup(groupId)
            set((state) => ({
                groups: state.groups.filter((group) => group.id !== groupId),
                currentGroup: state.currentGroup?.id === groupId ? null : state.currentGroup,
                submitting: false,
            }))
            return true
        } catch (error) {
            set({ submitting: false, error: errorMessage(error) })
            return false
        }
    },

    addMember: async (groupId, data) => {
        set({ submitting: true, error: null })
        try {
            await GroupsService.addGroupMember(groupId, data)
            await get().fetchGroup(groupId)
            set({ submitting: false })
            return true
        } catch (error) {
            set({ submitting: false, error: errorMessage(error) })
            return false
        }
    },

    updateMemberRole: async (groupId, memberId, data) => {
        set({ submitting: true, error: null })
        try {
            const response = await GroupsService.updateGroupMemberRole(groupId, memberId, data)
            set((state) => ({
                currentGroup: state.currentGroup?.id === groupId
                    ? { ...state.currentGroup, members: state.currentGroup.members.map((member) => member.id === memberId ? { ...member, role: response.member.role } : member) }
                    : state.currentGroup,
                submitting: false,
            }))
            return true
        } catch (error) {
            set({ submitting: false, error: errorMessage(error) })
            return false
        }
    },

    removeMember: async (groupId, memberId) => {
        set({ submitting: true, error: null })
        try {
            await GroupsService.removeGroupMember(groupId, memberId)
            await get().fetchGroup(groupId)
            set({ submitting: false })
            return true
        } catch (error) {
            set({ submitting: false, error: errorMessage(error) })
            return false
        }
    },

    clearCurrentGroup: () => set({ currentGroup: null }),
    clearError: () => set({ error: null }),
}))
