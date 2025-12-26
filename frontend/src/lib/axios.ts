
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/store/useAuthStore'
import { getClientTenantSlug } from '@/lib/tenant'

const envApiUrl = process.env.NEXT_PUBLIC_API_URL
const isAbsoluteHttpUrl = (value: string) => /^https?:\/\//i.test(value)
const isLikelyNextOrigin = (value: string) => /localhost:3000/i.test(value)
const baseURL =
  envApiUrl && isAbsoluteHttpUrl(envApiUrl) && !isLikelyNextOrigin(envApiUrl)
    ? envApiUrl
    : 'http://localhost:5000/api'

axios.defaults.baseURL = baseURL
axios.defaults.headers.common['Content-Type'] = 'application/json'

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
})

type RetriableRequestConfig = AxiosRequestConfig & { _retry?: boolean }

const attachInterceptors = (instance: AxiosInstance) => {
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
        ;(config.headers as any)['X-Tenant-Slug'] = tenantSlug
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
attachInterceptors(axios)

export default api
