import api from '@/lib/axios'
import type { DashboardMetrics, DepartmentStat } from '@/services/analytics/types'
import type { UpcomingEvent } from '@/services/dashboard/types'

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

export const fetchDashboardMetrics = async (params?: {
  startDate?: string
  endDate?: string
}): Promise<DashboardMetrics> => {
  const response = await api.get('/analytics/dashboard', { params })
  return response.data.data
}

export const fetchDepartmentStats = async (): Promise<DepartmentStat[]> => {
  const response = await api.get('/analytics/departments')
  return response.data.data
}

export const fetchUpcomingEvents = async (): Promise<UpcomingEvent[]> => {
  const response = await api.get('/analytics/events')
  const raw = response.data?.data ?? response.data
  const events = Array.isArray(raw) ? raw : []

  const dateFormatter = new Intl.DateTimeFormat('en-US', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
  })

  return events.map((event: UpcomingEvent) => ({
    ...event,
    date: dateFormatter.format(new Date(event.date)),
  }))
}

export const fetchDashboardMetricsServer = async (token: string | null, params?: {
  startDate?: string
  endDate?: string
}): Promise<DashboardMetrics | null> => {
  const query = new URLSearchParams()
  if (params?.startDate) query.set('startDate', params.startDate)
  if (params?.endDate) query.set('endDate', params.endDate)
  const path = query.toString() ? `/api/analytics/dashboard?${query}` : '/api/analytics/dashboard'
  return fetchWithToken<DashboardMetrics>(path, token)
}

export const fetchDepartmentStatsServer = async (token: string | null): Promise<DepartmentStat[]> => {
  const payload = await fetchWithToken<DepartmentStat[]>(`/api/analytics/departments`, token)
  return Array.isArray(payload) ? payload : []
}
