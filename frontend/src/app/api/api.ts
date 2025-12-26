import axios from 'axios'
import { useAuthStore } from '@/store/useAuthStore'
import { getClientTenantSlug } from '@/lib/tenant'

const envApiUrl = process.env.NEXT_PUBLIC_API_URL
const isAbsoluteHttpUrl = (value: string) => /^https?:\/\//i.test(value)
const isLikelyNextOrigin = (value: string) => /localhost:3000/i.test(value)
const API_URL =
  envApiUrl && isAbsoluteHttpUrl(envApiUrl) && !isLikelyNextOrigin(envApiUrl)
    ? envApiUrl
    : 'http://localhost:5000/api'

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
})

api.interceptors.request.use(
    (config) => {
        const token = useAuthStore.getState().token
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }

        if (typeof window !== 'undefined') {
            const tenantSlug = getClientTenantSlug()
            if (tenantSlug) {
                config.headers = config.headers ?? {}
                ;(config.headers as any)['X-Tenant-Slug'] = tenantSlug
            }
        }
        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true
            const token = useAuthStore.getState().token
            const url = String(originalRequest?.url || '')
            const isAuthFlow = url.startsWith('/auth/') || url.includes('/auth/')
            if (!token || isAuthFlow) {
                return Promise.reject(error)
            }
            try {
                // Attempt to refresh token
                // Note: This requires a refresh token flow which might need more setup
                // For now, we'll just logout if 401
                useAuthStore.getState().logout()
                window.location.href = '/login'
            } catch (refreshError) {
                useAuthStore.getState().logout()
                window.location.href = '/login'
            }
        }
        return Promise.reject(error)
    }
)

export default api
