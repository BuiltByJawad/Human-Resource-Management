import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/store/useAuthStore'
import { getClientTenantSlug } from '@/lib/tenant'
import { getApiBaseUrl } from '@/lib/config/env'

export const API_BASE_URL: string = getApiBaseUrl()

export type RetriableRequestConfig = AxiosRequestConfig & { _retry?: boolean }

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

const attachInterceptors = (instance: AxiosInstance): void => {
  instance.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
      const { token } = useAuthStore.getState()
      if (token) {
        config.headers = config.headers ?? {}
        config.headers.Authorization = `Bearer ${token}`
      }

      const tenantSlug = getClientTenantSlug()
      if (tenantSlug) {
        config.headers = config.headers ?? {}
        ;(config.headers as Record<string, string>)['X-Tenant-Slug'] = tenantSlug
      }
    }
    return config
  })

  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config as RetriableRequestConfig
      if (error.response?.status === 401 && typeof window !== 'undefined' && !originalRequest?._retry) {
        const { refreshSession } = useAuthStore.getState()
        originalRequest._retry = true
        const refreshed = await refreshSession({ silent: true })
        if (refreshed) {
          const { token } = useAuthStore.getState()
          originalRequest.headers = originalRequest.headers ?? {}
          if (token) {
            originalRequest.headers.Authorization = `Bearer ${token}`
          }
          return instance(originalRequest)
        }
      }
      return Promise.reject(error)
    }
  )
}

attachInterceptors(api)

axios.defaults.baseURL = API_BASE_URL
axios.defaults.headers.common['Content-Type'] = 'application/json'
attachInterceptors(axios)

export const apiClient: AxiosInstance = api

export default apiClient
