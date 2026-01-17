import api from '@/lib/axios'
import type { DashboardMetrics, DepartmentStat } from '@/services/analytics/types'

export const analyticsService = {
  getDashboardMetrics: async (params?: { startDate?: string; endDate?: string }): Promise<DashboardMetrics> => {
    const response = await api.get('/analytics/dashboard', { params })
    return response.data.data
  },

  getDepartmentStats: async (): Promise<DepartmentStat[]> => {
    const response = await api.get('/analytics/departments')
    return response.data.data
  },

  getUpcomingEvents: async (): Promise<{ id: string; title: string; date: string; type: string }[]> => {
    const response = await api.get('/analytics/events')
    const raw = response.data?.data ?? response.data
    return Array.isArray(raw) ? raw : []
  },
}
