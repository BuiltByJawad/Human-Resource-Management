import api from '@/lib/axios'
import type { BurnoutAnalyticsResponse } from '@/services/analytics/burnout/types'

const buildApiBase = () =>
  process.env.BACKEND_URL ||
  (process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api$/, '') : null) ||
  'http://localhost:5000'

const fetchWithToken = async <T>(path: string, token: string | null): Promise<T | null> => {
  if (!token) return null
  try {
    const response = await fetch(`${buildApiBase()}${path}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    })

    if (!response.ok) return null
    const payload = (await response.json().catch(() => null)) as { data?: T } | T | null
    if (!payload) return null
    return (payload as { data?: T }).data ?? (payload as T)
  } catch {
    return null
  }
}

export const fetchBurnoutAnalytics = async (period: number): Promise<BurnoutAnalyticsResponse> => {
  const response = await api.get('/analytics/burnout', { params: { period } })
  return (response.data?.data ?? response.data) as BurnoutAnalyticsResponse
}

export const fetchBurnoutAnalyticsServer = async (
  token: string | null,
  period: number
): Promise<BurnoutAnalyticsResponse | null> =>
  fetchWithToken<BurnoutAnalyticsResponse>(`/api/analytics/burnout?period=${period}`, token)
