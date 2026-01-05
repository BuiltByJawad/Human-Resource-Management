import api from '@/lib/axios'
import type { DashboardMetrics, DepartmentStat, UpcomingEvent } from '@/features/analytics/types/analytics.types'

const withAuthConfig = (token?: string) => (token ? { headers: { Authorization: `Bearer ${token}` } } : undefined)
const unwrap = <T>(res: any): T => res?.data?.data ?? res?.data ?? res

export async function getDashboardMetrics(
  params?: { startDate?: string; endDate?: string },
  token?: string,
): Promise<DashboardMetrics> {
  const res = await api.get('/analytics/dashboard', { params, ...withAuthConfig(token) })
  return unwrap<DashboardMetrics>(res)
}

export async function getDepartmentStats(token?: string): Promise<DepartmentStat[]> {
  const res = await api.get('/analytics/departments', withAuthConfig(token))
  return unwrap<DepartmentStat[]>(res) ?? []
}

export async function getUpcomingEvents(token?: string): Promise<UpcomingEvent[]> {
  const res = await api.get('/analytics/events', withAuthConfig(token))
  const events = unwrap<UpcomingEvent[]>(res)
  return Array.isArray(events) ? events : []
}
