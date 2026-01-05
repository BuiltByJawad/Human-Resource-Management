import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios'
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
      // NOTE: auth token should be injected by callers via config.headers.

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
