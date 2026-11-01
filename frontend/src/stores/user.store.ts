import { create } from 'zustand'
import {
    AuthService,
    OpenAPI,
    type AuthSuccessResponse,
    type AuthUser,
} from '../api'

// The access token is an HttpOnly cookie, so API requests must include cookies.
OpenAPI.WITH_CREDENTIALS = true
OpenAPI.CREDENTIALS = 'include'

const getErrorMessage = (error: unknown) =>
    error instanceof Error ? error.message : 'Не удалось выполнить запрос'

export type UserStore = {
    user: AuthUser | null
    isAuthenticated: boolean
    loading: boolean
    authReady: boolean
    error: string | null

    // Kept for components that position their UI around platform safe areas.
    topSpacer: string
    bottomSpacer: string

    initializeAuth: () => Promise<AuthSuccessResponse | null>
    fetchMe: () => Promise<AuthSuccessResponse | null>
    completeYandexLogin: (
        code: string,
        state: string,
    ) => Promise<AuthSuccessResponse | null>
    startYandexLogin: () => void
    logout: () => Promise<void>
    clearError: () => void
}

const setAuthenticatedUser = (
    set: (partial: Partial<UserStore>) => void,
    response: AuthSuccessResponse,
) => {
    set({
        user: response.user,
        isAuthenticated: true,
        loading: false,
        authReady: true,
        error: null,
    })
}

export const useUserStore = create<UserStore>((set, get) => ({
    user: null,
    isAuthenticated: false,
    loading: false,
    authReady: false,
    error: null,
    topSpacer: '4px',
    bottomSpacer: '4px',

    initializeAuth: async () => get().fetchMe(),

    fetchMe: async () => {
        set({ loading: true, error: null })

        try {
            const response = await AuthService.meUser()
            setAuthenticatedUser(set, response)
            return response
        } catch {
            // A 401 is an expected result for a visitor who has not logged in yet.
            set({
                user: null,
                isAuthenticated: false,
                loading: false,
                authReady: true,
                error: null,
            })
            return null
        }
    },

    completeYandexLogin: async (code, state) => {
        set({ loading: true, error: null })

        try {
            const response = await AuthService.authYandexCallback(code, state)
            setAuthenticatedUser(set, response)
            return response
        } catch (error) {
            set({
                loading: false,
                authReady: true,
                error: getErrorMessage(error),
            })
            return null
        }
    },

    startYandexLogin: () => {
        if (typeof window === 'undefined') return

        // OAuth is a browser redirect, rather than an XHR request. The remaining
        // authentication calls use the generated AuthService methods above.
        window.location.assign(`${OpenAPI.BASE}/v1/auth/yandex/url`)
    },

    logout: async () => {
        set({ loading: true, error: null })

        try {
            await AuthService.logoutUser()
        } catch (error) {
            set({ error: getErrorMessage(error) })
        } finally {
            set({
                user: null,
                isAuthenticated: false,
                loading: false,
                authReady: true,
            })
        }
    },

    clearError: () => set({ error: null }),
}))
