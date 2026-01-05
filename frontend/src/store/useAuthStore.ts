import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { loginRequest, refreshSessionRequest, logoutRequest } from '@/features/auth/services/auth.api'
import type { AuthUserPayload, CurrentUser } from '@/features/auth/types/auth.types'
import type { Permission } from '@/shared/constants/permissions'
import { buildTenantStorageKey, getClientTenantSlug } from '@/lib/tenant'

type AuthPersistMode = 'local' | 'session'

const AUTH_STORAGE_KEY = 'auth-storage'
const AUTH_STORAGE_MODE_KEY = 'auth-storage-mode'

const resolveTenantKey = (baseKey: string) => {
    if (typeof window === 'undefined') return baseKey
    return buildTenantStorageKey(baseKey, getClientTenantSlug())
}

function resolvePersistMode(): AuthPersistMode {
    if (typeof window === 'undefined') return 'session'

    try {
        const explicitMode = window.localStorage.getItem(resolveTenantKey(AUTH_STORAGE_MODE_KEY)) as AuthPersistMode | null
        if (explicitMode === 'local' || explicitMode === 'session') {
            return explicitMode
        }

        const tenantAuthKey = resolveTenantKey(AUTH_STORAGE_KEY)
        const hasTenantLocalAuth = !!window.localStorage.getItem(tenantAuthKey)
        if (hasTenantLocalAuth) {
            return 'local'
        }

        const tenantSlug = getClientTenantSlug()
        const shouldMigrateLegacy = !tenantSlug
        if (shouldMigrateLegacy) {
            const hasLegacyLocalAuth = !!window.localStorage.getItem(AUTH_STORAGE_KEY)
            return hasLegacyLocalAuth ? 'local' : 'session'
        }

        return 'session'
    } catch {
        return 'session'
    }
}

function setPersistMode(mode: AuthPersistMode) {
    if (typeof window === 'undefined') return
    try {
        window.localStorage.setItem(resolveTenantKey(AUTH_STORAGE_MODE_KEY), mode)
    } catch {
    }
}

const authPersistStorage = {
    getItem: (name: string) => {
        if (typeof window === 'undefined') return null
        try {
            const mode = resolvePersistMode()
            const storage = mode === 'local' ? window.localStorage : window.sessionStorage
            const tenantKey = resolveTenantKey(name)
            const value = storage.getItem(tenantKey)
            if (value) return value

            const tenantSlug = getClientTenantSlug()
            if (!tenantSlug && tenantKey !== name) {
                const legacy = storage.getItem(name)
                if (legacy) {
                    storage.setItem(tenantKey, legacy)
                    storage.removeItem(name)
                    return legacy
                }
            }

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
            storage.setItem(resolveTenantKey(name), value)
        } catch {
        }
    },
    removeItem: (name: string) => {
        if (typeof window === 'undefined') return
        try {
            window.localStorage.removeItem(resolveTenantKey(name))
        } catch {
        }
        try {
            window.sessionStorage.removeItem(resolveTenantKey(name))
        } catch {
        }

        const tenantSlug = typeof window !== 'undefined' ? getClientTenantSlug() : null
        if (!tenantSlug) {
            try {
                window.localStorage.removeItem(name)
            } catch {
            }
            try {
                window.sessionStorage.removeItem(name)
            } catch {
            }
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
    organizationId?: string | null
    department?: string
    phoneNumber?: string
    address?: string
    dateOfBirth?: string
    gender?: string
    maritalStatus?: string
    emergencyContact?: any
    employee?: any
    status?: string
    permissions: Permission[]
}

const toPermissions = (input: unknown, fallback: Permission[] = []): Permission[] => {
    if (!Array.isArray(input)) return fallback
    return input.filter((perm): perm is Permission => typeof perm === 'string') as Permission[]
}

const buildUserFromPayload = (payload: AuthUserPayload | CurrentUser | null | undefined, fallbackPermissions: Permission[] = []): User | null => {
    if (!payload) {
        return null
    }

    const permissions: Permission[] = toPermissions((payload as AuthUserPayload | CurrentUser).permissions, fallbackPermissions)
    const asAuthPayload = payload as AuthUserPayload

    return {
        id: payload.id ?? '',
        email: payload.email ?? '',
        firstName: payload.firstName ?? null,
        lastName: payload.lastName ?? null,
        role: payload.role ?? 'User',
        avatarUrl: payload.avatarUrl ?? null,
        organizationId: 'organizationId' in asAuthPayload ? asAuthPayload.organizationId ?? null : null,
        department: 'department' in asAuthPayload ? asAuthPayload.department : undefined,
        phoneNumber: 'phoneNumber' in asAuthPayload ? asAuthPayload.phoneNumber : undefined,
        address: 'address' in asAuthPayload ? asAuthPayload.address : undefined,
        dateOfBirth: 'dateOfBirth' in asAuthPayload ? asAuthPayload.dateOfBirth : undefined,
        gender: 'gender' in asAuthPayload ? asAuthPayload.gender : undefined,
        maritalStatus: 'maritalStatus' in asAuthPayload ? asAuthPayload.maritalStatus : undefined,
        emergencyContact: 'emergencyContact' in asAuthPayload ? asAuthPayload.emergencyContact : undefined,
        employee: 'employee' in asAuthPayload ? asAuthPayload.employee : (payload as CurrentUser).employee ?? undefined,
        status: 'status' in asAuthPayload ? asAuthPayload.status : undefined,
        permissions,
    }
}

export interface AuthState {
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
        (set, get): AuthState => {
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
                            opposite.removeItem(resolveTenantKey(AUTH_STORAGE_KEY))
                        } catch {
                        }
                    }
                    set({ isAuthTransition: true })
                    try {
                        const response = await loginRequest({ email, password, rememberMe })
                        const permissions = toPermissions(response?.permissions, [])
                        const accessToken = response?.accessToken ?? null
                        const refreshToken = response?.refreshToken ?? null
                        const normalizedUser = buildUserFromPayload(response?.user, permissions) ?? null

                        set({
                            user: normalizedUser,
                            token: accessToken,
                            refreshToken,
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
                    // Clear store immediately so UI re-renders logged-out state without showing dashboard
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
                    if (typeof window !== 'undefined') {
                        // Best-effort clear of auth cookies for SPA navigation
                        try {
                            document.cookie = 'accessToken=; Max-Age=0; path=/'
                            document.cookie = 'refreshToken=; Max-Age=0; path=/'
                        } catch {
                        }
                        try {
                            window.localStorage.removeItem(resolveTenantKey(AUTH_STORAGE_KEY))
                        } catch (error) {
                            if (process.env.NODE_ENV !== 'production') {
                                console.warn('Failed to clear auth storage', error)
                            }
                        }
                        try {
                            window.sessionStorage.removeItem(resolveTenantKey(AUTH_STORAGE_KEY))
                        } catch {
                        }
                        try {
                            window.localStorage.removeItem(resolveTenantKey(AUTH_STORAGE_MODE_KEY))
                        } catch {
                        }
                    }
                    try {
                        await logoutRequest()
                    } catch (error) {
                        if (process.env.NODE_ENV !== 'production') {
                            console.warn('Logout request failed', error)
                        }
                    }
                    // End transition after cleanup
                    set({ isLoggingOut: false, isAuthTransition: false })
                },
                endAuthTransition: () => set({ isAuthTransition: false, isLoggingOut: false }),
                clearAuth: () => {
                    if (typeof window !== 'undefined') {
                        try {
                            window.localStorage.removeItem(resolveTenantKey(AUTH_STORAGE_MODE_KEY))
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
                    const { refreshToken, token, user, rememberMe } = get()
                    try {
                        const requestBody = refreshToken ? { refreshToken, rememberMe } : { rememberMe }
                        const { ok, data } = await refreshSessionRequest(requestBody)
                        if (!ok) {
                            throw new Error('Token refresh failed')
                        }
                        const payload = data ?? {}
                        const permissions = toPermissions(payload?.permissions ?? user?.permissions, [])
                        const newAccessToken = payload?.accessToken || token
                        const newRefreshToken = payload?.refreshToken || refreshToken
                        const nextUser = buildUserFromPayload(payload?.user, permissions) ?? user

                        set({
                            token: newAccessToken,
                            refreshToken: newRefreshToken,
                            user: nextUser,
                            isAuthenticated: !!newAccessToken,
                            lastRefreshedAt: Date.now(),
                        })

                        return true
                    } catch (error) {
                        if (!silent && process.env.NODE_ENV !== 'production') {
                            console.warn('Session refresh failed', error)
                        }
                        get().logout()
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
                                organizationId: null,
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
