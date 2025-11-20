import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import axios from 'axios'

interface User {
    id: string
    email: string
    firstName?: string
    lastName?: string
    role: string
    avatarUrl?: string
    department?: string
}

interface AuthState {
    user: User | null
    token: string | null
    isAuthenticated: boolean
    login: (email: string, password: string) => Promise<void>
    logout: () => void
    updateUser: (updates: Partial<User>) => void
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            token: null,
            isAuthenticated: false,
            login: async (email, password) => {
                try {
                    const response = await axios.post(`${API_URL}/auth/login`, { email, password })
                    const { user, accessToken } = response.data.data
                    set({ user, token: accessToken, isAuthenticated: true })
                } catch (error: any) {
                    throw new Error(error.response?.data?.message || 'Login failed')
                }
            },
            logout: () => set({ user: null, token: null, isAuthenticated: false }),
            updateUser: (updates) =>
                set((state) => ({
                    user: state.user ? { ...state.user, ...updates } : null,
                })),
        }),
        {
            name: 'auth-storage',
        }
    )
)
