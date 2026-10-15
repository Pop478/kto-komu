import { create } from 'zustand'
export const notify = {
    success: (message: string) =>
        useNotificationStore.getState().add('success', message),

    warning: (message: string) =>
        useNotificationStore.getState().add('warning', message),

    error: (message: string) =>
        useNotificationStore.getState().add('error', message),
}

export type NotificationType = 'success' | 'warning' | 'error'

export interface NotificationItem {
    id: string
    type: NotificationType
    message: string
}

interface NotificationStore {
    items: NotificationItem[]
    add: (type: NotificationType, message: string) => void
    remove: (id: string) => void
}

let counter = 0

function generateId(): string {
    counter += 1
    return `${Date.now()}-${counter}`
}

export const useNotificationStore = create<NotificationStore>((set) => ({
    items: [],

    add: (type, message) =>
        set((state) => ({
            items: [
                ...state.items,
                {
                    id: generateId(),
                    type,
                    message,
                },
            ],
        })),

    remove: (id) =>
        set((state) => ({
            items: state.items.filter((n) => n.id !== id),
        })),
}))
