import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import axios from 'axios'
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
    login: (email: string, password: string) => Promise<void>
    logout: () => void
    updateUser: (updates: Partial<User>) => void
    setUser: (user: User | null) => void
    hasPermission: (permission: Permission) => boolean
    hasAnyPermission: (permissions: Permission[]) => boolean
    hasAllPermissions: (permissions: Permission[]) => boolean
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            isAuthenticated: false,
            login: async (email, password) => {
                try {
                    const response = await axios.post(`${API_URL}/auth/login`, { email, password })
                    const { user, accessToken } = response.data.data
                    const normalizedUser: User = {
                        ...user,
                        permissions: user.permissions ?? [],
                    }
                    set({ user: normalizedUser, token: accessToken, isAuthenticated: true })
                } catch (error: any) {
                    throw new Error(error.response?.data?.message || 'Login failed')
                }
            },
            logout: () => set({ user: null, token: null, isAuthenticated: false }),
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
                }),
            hasPermission: (permission) => {
                const { user } = get()
                // Legacy fallback: if permissions are not configured yet, allow access
                if (!user || !Array.isArray(user.permissions) || user.permissions.length === 0) {
                    return true
                }
                return user.permissions.includes(permission)
            },
            hasAnyPermission: (permissions) => {
                const { user } = get()
                if (!user || !Array.isArray(user.permissions) || user.permissions.length === 0) {
                    return true
                }
                return permissions.some((permission) => user.permissions.includes(permission))
            },
            hasAllPermissions: (permissions) => {
                const { user } = get()
                if (!user || !Array.isArray(user.permissions) || user.permissions.length === 0) {
                    return true
                }
                return permissions.every((permission) => user.permissions.includes(permission))
            },
        }),
        {
            name: 'auth-storage',
        }
    )
)
