import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { Permission } from '@/constants/permissions'
import type { CurrentUser } from '@/types/hrm'

type AuthPersistMode = 'local' | 'session'

const AUTH_STORAGE_KEY = 'auth-storage'
const AUTH_STORAGE_MODE_KEY = 'auth-storage-mode'

function resolvePersistMode(): AuthPersistMode {
    if (typeof window === 'undefined') return 'session'

    try {
        const explicitMode = window.localStorage.getItem(AUTH_STORAGE_MODE_KEY) as AuthPersistMode | null
        if (explicitMode === 'local' || explicitMode === 'session') {
            return explicitMode
        }

        const hasLocalAuth = !!window.localStorage.getItem(AUTH_STORAGE_KEY)
        if (hasLocalAuth) {
            return 'local'
        }

        return 'session'
    } catch {
        return 'session'
    }
}

function setPersistMode(mode: AuthPersistMode) {
    if (typeof window === 'undefined') return
    try {
        window.localStorage.setItem(AUTH_STORAGE_MODE_KEY, mode)
    } catch {
    }
}

const authPersistStorage = {
    getItem: (name: string) => {
        if (typeof window === 'undefined') return null
        try {
            const mode = resolvePersistMode()
            const storage = mode === 'local' ? window.localStorage : window.sessionStorage
            const value = storage.getItem(name)
            if (value) return value

            return null
        } catch {
            return null
        }
    },
    setItem: (name: string, value: string) => {
        if (typeof window === 'undefined') return
        try {
            const mode = resolvePersistMode()
            const storage = mode === 'local' ? window.localStorage : window.sessionStorage
            storage.setItem(name, value)
        } catch {
        }
    },
    removeItem: (name: string) => {
        if (typeof window === 'undefined') return
        try {
            window.localStorage.removeItem(name)
        } catch {
        }
        try {
            window.sessionStorage.removeItem(name)
        } catch {
        }

        try {
            window.localStorage.removeItem(name)
        } catch {
        }
        try {
            window.sessionStorage.removeItem(name)
        } catch {
        }
    },
}

export interface User {
    id: string
    email: string
    firstName: string | null
    lastName: string | null
    role: string
    avatarUrl: string | null
    department?: string
    phoneNumber?: string
    address?: string
    dateOfBirth?: string
    gender?: string
    maritalStatus?: string
    emergencyContact?: any
    employee?: any
    status?: string
    mfaEnabled?: boolean
    permissions: Permission[]
}

interface AuthState {
    user: User | null
    token: string | null
    refreshToken: string | null
    isAuthenticated: boolean
    isLoggingOut: boolean
    isAuthTransition: boolean
    lastRefreshedAt: number | null
    rememberMe: boolean
    login: (email: string, password: string, options?: { rememberMe?: boolean }) => Promise<void>
    logout: () => Promise<void>
    endAuthTransition: () => void
    clearAuth: () => void
    refreshSession: (options?: { silent?: boolean }) => Promise<boolean>
    updateUser: (updates: Partial<User>) => void
    setUser: (user: User | null) => void
    hasPermission: (permission: Permission) => boolean
    hasAnyPermission: (permissions: Permission[]) => boolean
    hasAllPermissions: (permissions: Permission[]) => boolean
    bootstrapFromServer: (payload: { user: CurrentUser | null; token: string | null }) => void
}

const DEFAULT_AUTH_STATE: Pick<
	AuthState,
	'user' | 'token' | 'refreshToken' | 'isAuthenticated' | 'rememberMe' | 'lastRefreshedAt'
> = {
	user: null,
	token: null,
	refreshToken: null,
	isAuthenticated: false,
	rememberMe: false,
	lastRefreshedAt: null,
}

function getInitialAuthState(): Pick<
    AuthState,
    'user' | 'token' | 'refreshToken' | 'isAuthenticated' | 'rememberMe' | 'lastRefreshedAt'
> {
    // IMPORTANT: This must be identical on the server and on the first client render
    // to avoid hydration mismatches. We intentionally do NOT read from
    // localStorage/sessionStorage here. Persist middleware will rehydrate
    // from storage after mount.
    const mode: AuthPersistMode = typeof window === 'undefined' ? 'session' : resolvePersistMode()
    return {
        user: null,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
        rememberMe: mode === 'local',
        lastRefreshedAt: null,
    }
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => {
            const initial = getInitialAuthState()
            return {
                user: initial.user,
                token: initial.token,
                refreshToken: initial.refreshToken,
                isAuthenticated: initial.isAuthenticated,
                isLoggingOut: false,
                isAuthTransition: false,
                lastRefreshedAt: initial.lastRefreshedAt,
                rememberMe: initial.rememberMe,
                login: async (email, password, options) => {
                    const rememberMe = !!options?.rememberMe
                    setPersistMode(rememberMe ? 'local' : 'session')

                    if (typeof window !== 'undefined') {
                        try {
                            const opposite = rememberMe ? window.sessionStorage : window.localStorage
                            opposite.removeItem(AUTH_STORAGE_KEY)
                        } catch {
                        }
                    }
                    set({ isAuthTransition: true })
                    try {
                        const response = await fetch('/api/auth/login', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            credentials: 'include',
                            body: JSON.stringify({ email, password, rememberMe }),
                        })
                        const json = await response.json()
                        if (!response.ok) {
                            throw new Error(json?.error || json?.message || 'Login failed')
                        }
                        const payload = json?.data ?? json
                        const { user, accessToken, refreshToken, permissions } = payload
                        const normalizedUser: User = {
                            ...user,
                            permissions: permissions ?? [],
                        }
                        set({
                            user: normalizedUser,
                            token: accessToken,
                            refreshToken: refreshToken ?? null,
                            isAuthenticated: true,
                            isLoggingOut: false,
                            rememberMe,
                            isAuthTransition: true,
                            lastRefreshedAt: Date.now(),
                        })
                    } catch (error: any) {
                        set({ isAuthTransition: false })
                        const message =
                            error?.response?.data?.error?.message ||
                            error?.response?.data?.message ||
                            error?.message ||
                            'Login failed'
                        throw new Error(message)
                    }
                },
                logout: async () => {
                    set({ isAuthTransition: true, isLoggingOut: true })
                    if (typeof window !== 'undefined') {
                        try {
                            await fetch('/api/auth/logout', { credentials: 'include' })
                        } catch {
                        }
                    }
                    if (typeof window !== 'undefined') {
                        try {
                            window.localStorage.removeItem(AUTH_STORAGE_KEY)
                        } catch (error) {
                            if (process.env.NODE_ENV !== 'production') {
                                console.warn('Failed to clear auth storage', error)
                            }
                        }
                        try {
                            window.sessionStorage.removeItem(AUTH_STORAGE_KEY)
                        } catch {
                        }
                        try {
                            window.localStorage.removeItem(AUTH_STORAGE_MODE_KEY)
                        } catch {
                        }
                    }
                    set({
                        user: null,
                        token: null,
                        refreshToken: null,
                        isAuthenticated: false,
                        rememberMe: false,
                        isLoggingOut: true,
                        isAuthTransition: true,
                        lastRefreshedAt: null,
                    })
                },
                endAuthTransition: () => set({ isAuthTransition: false, isLoggingOut: false }),
                clearAuth: () => {
                    if (typeof window !== 'undefined') {
                        try {
                            window.localStorage.removeItem(AUTH_STORAGE_MODE_KEY)
                        } catch {
                        }
                    }
                    set({
                        user: null,
                        token: null,
                        refreshToken: null,
                        isAuthenticated: false,
                        rememberMe: false,
                        isLoggingOut: false,
                        isAuthTransition: false,
                        lastRefreshedAt: null,
                    })
                },
                refreshSession: async ({ silent }: { silent?: boolean } = {}) => {
                    const { token, user, rememberMe, refreshToken } = get()
                    try {
                        const runRefresh = async () => {
                            const response = await fetch('/api/auth/refresh', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                credentials: 'include',
                                body: JSON.stringify({ rememberMe, refreshToken }),
                            })
                            const json: unknown = await response.json().catch(() => null)
                            return { response, json }
                        }

                        let { response, json } = await runRefresh()

                        const messageFromJson =
                            json && typeof json === 'object'
                                ? (((json as Record<string, unknown>).error as string) ||
                                    ((json as Record<string, unknown>).message as string) ||
                                    '')
                                : ''

                        const isMissingRefreshToken =
                            response.status === 401 &&
                            typeof messageFromJson === 'string' &&
                            messageFromJson.toLowerCase().includes('refresh token is required')

                        if (!response.ok && isMissingRefreshToken) {
                            await new Promise<void>((resolve) => setTimeout(resolve, 50))
                            ;({ response, json } = await runRefresh())
                        }

                        if (!response.ok) {
                            const nextMessage =
                                json && typeof json === 'object'
                                    ? (((json as Record<string, unknown>).error as string) ||
                                        ((json as Record<string, unknown>).message as string) ||
                                        'Token refresh failed')
                                    : 'Token refresh failed'

                            const finalMessage = typeof nextMessage === 'string' && nextMessage ? nextMessage : 'Token refresh failed'
                            throw new Error(finalMessage)
                        }

                        const root = (json && typeof json === 'object' ? (json as Record<string, unknown>) : {})
                        const dataNode = root.data
                        const payload =
                            dataNode && typeof dataNode === 'object' && !Array.isArray(dataNode)
                                ? (dataNode as Record<string, unknown>)
                                : root

                        const accessTokenCandidate = payload.accessToken
                        const tokenCandidate = payload.token
                        const refreshTokenCandidate = payload.refreshToken

                        const newAccessToken =
                            (typeof accessTokenCandidate === 'string' && accessTokenCandidate) ||
                            (typeof tokenCandidate === 'string' && tokenCandidate) ||
                            token

                        const newRefreshToken =
                            (typeof refreshTokenCandidate === 'string' ? refreshTokenCandidate : null) ?? refreshToken ?? null

                        const payloadUser = payload.user
                        const permissionsCandidate = payload.permissions
                        const resolvedPermissions =
                            Array.isArray(permissionsCandidate) ? (permissionsCandidate as Permission[]) : (payloadUser && typeof payloadUser === 'object'
                                ? (Array.isArray((payloadUser as Record<string, unknown>).permissions)
                                    ? ((payloadUser as Record<string, unknown>).permissions as Permission[])
                                    : user?.permissions ?? [])
                                : user?.permissions ?? [])

                        const nextUser =
                            payloadUser && typeof payloadUser === 'object' && !Array.isArray(payloadUser)
                                ? { ...(payloadUser as Record<string, unknown>), permissions: resolvedPermissions } as unknown as User
                                : user

                        set({
                            token: newAccessToken,
                            refreshToken: newRefreshToken,
                            user: nextUser,
                            isAuthenticated: !!newAccessToken,
                            lastRefreshedAt: Date.now(),
                        })

                        return true
                    } catch (error) {
                        if (process.env.NODE_ENV !== 'production') {
                            if (silent) {
                                console.warn('Session refresh failed (silent)', error)
                            } else {
                                console.warn('Session refresh failed', error)
                            }
                        }
                        const message = error instanceof Error ? error.message : ''
                        const isMissingRefreshToken =
                            typeof message === 'string' && message.toLowerCase().includes('refresh token is required')

                        if (!isMissingRefreshToken) {
                            get().logout()
                        }
                        return false
                    }
                },
                updateUser: (updates) =>
                    set((state) => ({
                        user: state.user
                            ? {
                                ...state.user,
                                ...updates,
                                permissions: updates.permissions ?? state.user.permissions ?? [],
                            }
                            : null,
                    })),
                setUser: (user) =>
                    set({
                        user: user ? { ...user, permissions: user.permissions ?? [] } : null,
                        isAuthenticated: !!user,
                        isLoggingOut: false,
                    }),
                hasPermission: (permission) => {
                    const { user } = get()
                    if (!user) {
                        return false
                    }
                    // Super Admin bypass
                    if (user.role === 'Super Admin') return true
                    return Array.isArray(user.permissions) && user.permissions.includes(permission)
                },
                hasAnyPermission: (permissions) => {
                    const { user } = get()
                    if (!user) return false
                    // Super Admin bypass
                    if (user.role === 'Super Admin') return true
                    if (!Array.isArray(user.permissions)) return false
                    return permissions.some((permission) => user.permissions.includes(permission))
                },
                hasAllPermissions: (permissions) => {
                    const { user } = get()
                    if (!user) return false
                    // Super Admin bypass
                    if (user.role === 'Super Admin') return true
                    if (!Array.isArray(user.permissions)) return false
                    return permissions.every((permission) => user.permissions.includes(permission))
                },
                bootstrapFromServer: ({ user: serverUser, token }) => {
                    if (typeof window === 'undefined') {
                        return
                    }

                    set((state) => {
                        // If we already have a user or token from persist/login, don't overwrite.
                        if (state.user || state.token) {
                            return state
                        }

                        if (!serverUser && !token) {
                            return state
                        }

                        let normalizedUser: User | null = null

                        if (serverUser) {
                            const permissions: Permission[] = Array.isArray(serverUser.permissions)
                                ? (serverUser.permissions as Permission[])
                                : []

                            normalizedUser = {
                                id: serverUser.id,
                                email: serverUser.email ?? '',
                                firstName: serverUser.firstName ?? null,
                                lastName: serverUser.lastName ?? null,
                                role: serverUser.role ?? 'User',
                                avatarUrl: serverUser.avatarUrl ?? null,
                                department: undefined,
                                phoneNumber: undefined,
                                address: undefined,
                                dateOfBirth: undefined,
                                gender: undefined,
                                maritalStatus: undefined,
                                emergencyContact: undefined,
                                employee: serverUser.employee ?? null,
                                status: undefined,
                                permissions,
                            }
                        }

                        const nextToken = token ?? state.token

                        return {
                            ...state,
                            user: normalizedUser,
                            token: nextToken,
                            isAuthenticated: !!nextToken || !!normalizedUser,
                        }
                    })
                },
            }
        },
        {
            name: AUTH_STORAGE_KEY,
            storage: createJSONStorage(() => authPersistStorage),
            partialize: (state) => ({
                user: state.user,
                token: state.token,
                refreshToken: state.refreshToken,
                isAuthenticated: state.isAuthenticated,
                rememberMe: state.rememberMe,
                lastRefreshedAt: state.lastRefreshedAt,
            }),
        }
    )
)
