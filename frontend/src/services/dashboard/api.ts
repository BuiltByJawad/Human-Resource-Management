import api from '@/lib/axios'
import type { DashboardStats, RecentActivity, UpcomingEvent } from '@/services/dashboard/types'
import { fetchUpcomingEvents as fetchAnalyticsUpcomingEvents } from '@/services/analytics/api'
import type { LeaveRequest } from '@/types/hrm'

const normalizeStats = (payload: unknown): DashboardStats => {
  const data = (payload as { stats?: unknown })?.stats ?? payload ?? {}
  const stats = data as Record<string, unknown>
  return {
    totalEmployees: Number(stats.totalEmployees) || 0,
    activeEmployees: Number(stats.activeEmployees) || 0,
    totalDepartments: Number(stats.totalDepartments) || 0,
    pendingLeaveRequests: Number(stats.pendingLeaveRequests) || 0,
    totalPayroll: Number(stats.totalPayroll) || 0,
    attendanceRate: Number(stats.attendanceRate) || 0,
  }
}

export const fetchDashboardStats = async (): Promise<DashboardStats> => {
  const response = await api.get('/dashboard/stats')
  const payload = response.data?.data ?? response.data
  return normalizeStats(payload)
}

export const fetchDashboardRecentActivities = async (): Promise<RecentActivity[]> => {
  const res = await api.get('/leave', { params: { limit: 8, page: 1 } })
  const raw = res.data?.data
  const leaveRequests = (Array.isArray(raw) ? raw : raw?.leaveRequests ?? []) as (LeaveRequest & {
    createdAt?: string | null
    employee?: { firstName?: string | null; lastName?: string | null } | null
  })[]

  const dateFormatter = new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: 'short',
    timeZone: 'UTC',
  })

  return leaveRequests.map((leave, index) => {
    const createdAt = leave.createdAt ? new Date(leave.createdAt) : null
    const timestamp = createdAt ? dateFormatter.format(createdAt) : ''

    const employeeName = `${leave.employee?.firstName ?? 'Employee'} ${leave.employee?.lastName ?? ''}`.trim() || 'Employee'

    return {
      id: leave.id ?? `leave-${leave.createdAt ?? 'unknown'}-${index}`,
      type: 'leave' as const,
      description: leave.reason ? `requested leave: ${leave.reason}` : 'requested leave',
      timestamp,
      employee: employeeName,
    }
  })
}

export const fetchUpcomingEvents = async (): Promise<UpcomingEvent[]> => {
  const events = await fetchAnalyticsUpcomingEvents()
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
  })) as UpcomingEvent[]
}

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

export const fetchDashboardStatsServer = async (token: string | null): Promise<DashboardStats | null> => {
  const payload = await fetchWithToken<DashboardStats | { stats?: DashboardStats }>(`/api/dashboard/stats`, token)
  if (!payload) return null
  if (typeof payload === 'object' && 'stats' in (payload as Record<string, unknown>)) {
    const stats = (payload as { stats?: DashboardStats }).stats
    return stats ?? normalizeStats(payload)
  }
  return normalizeStats(payload)
}

export const fetchDashboardRecentActivitiesServer = async (token: string | null): Promise<RecentActivity[] | null> => {
  const payload = await fetchWithToken<unknown>(`/api/leave?limit=8&page=1`, token)
  if (!payload) return null
  const root = (payload as { data?: unknown }).data ?? payload
  const leaveRequests = Array.isArray(root)
    ? root
    : (root as { leaveRequests?: unknown[] }).leaveRequests ?? []

  const dateFormatter = new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: 'short',
    timeZone: 'UTC',
  })

  return (
    leaveRequests as Array<LeaveRequest & { createdAt?: string | null; employee?: { firstName?: string; lastName?: string } }>
  )
    .map((leave, index) => {
      const createdAt = leave.createdAt ? new Date(leave.createdAt) : null
      const timestamp = createdAt ? dateFormatter.format(createdAt) : ''

      const employeeName = `${leave.employee?.firstName ?? 'Employee'} ${leave.employee?.lastName ?? ''}`.trim() || 'Employee'

      return {
        id: leave.id ?? `leave-${leave.createdAt ?? 'unknown'}-${index}`,
        type: 'leave' as const,
        description: leave.reason ? `requested leave: ${leave.reason}` : 'requested leave',
        timestamp,
        employee: employeeName,
      }
    })
}

export const fetchDashboardUpcomingEventsServer = async (token: string | null): Promise<UpcomingEvent[] | null> => {
  const payload = await fetchWithToken<UpcomingEvent[] | { data?: UpcomingEvent[] }>(`/api/analytics/events`, token)
  const root = Array.isArray(payload) ? payload : payload?.data
  if (!root) return null

  const dateFormatter = new Intl.DateTimeFormat('en-US', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
  })

  return root.map((event) => ({
    ...event,
    date: dateFormatter.format(new Date(event.date)),
  }))
}
