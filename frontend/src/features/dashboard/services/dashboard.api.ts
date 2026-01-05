import api from '@/lib/axios'
import type { DashboardStats, RecentActivity } from '@/features/dashboard/types/dashboard.types'

const withAuthConfig = (token?: string) => (token ? { headers: { Authorization: `Bearer ${token}` } } : undefined)
const unwrap = <T>(res: any): T => res?.data?.data ?? res?.data ?? res

export async function getDashboardStats(token?: string): Promise<DashboardStats> {
  const res = await api.get('/dashboard/stats', withAuthConfig(token))
  const data = unwrap<DashboardStats>(res)
  return {
    totalEmployees: Number((data as any)?.totalEmployees) || 0,
    activeEmployees: Number((data as any)?.activeEmployees) || 0,
    totalDepartments: Number((data as any)?.totalDepartments) || 0,
    pendingLeaveRequests: Number((data as any)?.pendingLeaveRequests) || 0,
    totalPayroll: Number((data as any)?.totalPayroll) || 0,
    attendanceRate: Number((data as any)?.attendanceRate) || 0,
  }
}

export async function getRecentActivities(token?: string): Promise<RecentActivity[]> {
  const res = await api.get('/leave', {
    params: { limit: 8, page: 1 },
    ...withAuthConfig(token),
  })
  const payload = res.data?.data ?? res.data
  if (!payload) return []

  const leaveRequests: any[] = Array.isArray(payload)
    ? payload
    : Array.isArray((payload as any)?.leaveRequests)
    ? (payload as any).leaveRequests
    : []

  return leaveRequests.map((leave) => {
    const createdAt = leave?.createdAt ? new Date(leave.createdAt) : null
    const timestamp = createdAt
      ? createdAt.toLocaleString(undefined, {
          hour: '2-digit',
          minute: '2-digit',
          day: '2-digit',
          month: 'short',
        })
      : ''

    const employeeName = `${leave?.employee?.firstName ?? 'Employee'} ${leave?.employee?.lastName ?? ''}`.trim() || 'Employee'

    return {
      id: String(leave?.id ?? crypto.randomUUID()),
      type: 'leave',
      description: leave?.reason ? `requested leave: ${leave.reason}` : 'requested leave',
      timestamp,
      employee: employeeName,
    }
  })
}
