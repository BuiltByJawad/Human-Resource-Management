
import axios from 'axios'
import { useAuthStore } from '@/store/useAuthStore'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
})

api.interceptors.request.use((config) => {
  // Client-side only - read token from zustand persist storage
  if (typeof window !== 'undefined') {
    const { token } = useAuthStore.getState()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    // Attempt refresh once when 401 and refresh token is available
    if (error.response?.status === 401 && typeof window !== 'undefined' && !originalRequest?._retry) {
      const { refreshToken, token, setUser, logout } = useAuthStore.getState() as any
      if (refreshToken) {
        originalRequest._retry = true
        try {
          const refreshResponse = await axios.post(
            `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/auth/refresh`,
            { refreshToken }
          )
          const data = refreshResponse.data.data || refreshResponse.data
          const newAccessToken = data?.accessToken || data?.token
          const newRefreshToken = data?.refreshToken

          useAuthStore.setState({
            token: newAccessToken ?? token,
            refreshToken: newRefreshToken ?? refreshToken,
            user: data?.user ? { ...(data.user || {}), permissions: data.permissions ?? data.user?.permissions ?? [] } : useAuthStore.getState().user,
            isAuthenticated: !!newAccessToken
          })

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
          return api(originalRequest)
        } catch (refreshError) {
          logout?.()
          return Promise.reject(refreshError)
        }
      }
    }
    return Promise.reject(error)
  }
)

export default api
