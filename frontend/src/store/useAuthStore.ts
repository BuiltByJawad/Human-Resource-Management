import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api, { API_BASE_URL } from '@/lib/axios'
import type { Permission } from '@/constants/permissions'

interface User {
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
    permissions: Permission[]
}

interface AuthState {
    user: User | null
    token: string | null
    isAuthenticated: boolean
    isLoggingOut: boolean
    login: (email: string, password: string) => Promise<void>
    logout: () => void
    updateUser: (updates: Partial<User>) => void
    setUser: (user: User | null) => void
    hasPermission: (permission: Permission) => boolean
    hasAnyPermission: (permissions: Permission[]) => boolean
    hasAllPermissions: (permissions: Permission[]) => boolean
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoggingOut: false,
            login: async (email, password) => {
                try {
                    const response = await api.post(`/auth/login`, { email, password })
                    const { user, accessToken, permissions } = response.data.data
                    const normalizedUser: User = {
                        ...user,
                        permissions: permissions ?? [],
                    }
                    set({ user: normalizedUser, token: accessToken, isAuthenticated: true, isLoggingOut: false })
                } catch (error: any) {
                    const message =
                        error?.response?.data?.error?.message ||
                        error?.response?.data?.message ||
                        error?.message ||
                        'Login failed'
                    throw new Error(message)
                }
            },
            logout: () => set({ user: null, token: null, isAuthenticated: false, isLoggingOut: true }),
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
                return Array.isArray(user.permissions) && user.permissions.includes(permission)
            },
            hasAnyPermission: (permissions) => {
                const { user } = get()
                if (!user || !Array.isArray(user.permissions)) {
                    return false
                }
                return permissions.some((permission) => user.permissions.includes(permission))
            },
            hasAllPermissions: (permissions) => {
                const { user } = get()
                if (!user || !Array.isArray(user.permissions)) {
                    return false
                }
                return permissions.every((permission) => user.permissions.includes(permission))
            },
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({
                user: state.user,
                token: state.token,
                isAuthenticated: state.isAuthenticated,
            }),
        }
    )
)
