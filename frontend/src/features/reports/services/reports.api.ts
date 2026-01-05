import api from '@/lib/axios'
import type { ReportsFilterParams } from '@/features/reports/types/reports.types'

const withAuthConfig = (token?: string) => (token ? { headers: { Authorization: `Bearer ${token}` } } : undefined)

export async function fetchReportsDashboard(token?: string) {
  const response = await api.get('/reports/dashboard', withAuthConfig(token))
  return response.data?.data ?? response.data
}

export async function fetchReportByType(
  type: 'employees' | 'attendance' | 'leave' | 'payroll',
  filters: ReportsFilterParams,
  token?: string,
) {
  const params: Record<string, string> = {}
  if (filters.startDate) params.startDate = filters.startDate
  if (filters.endDate) params.endDate = filters.endDate
  if (filters.departmentId) params.departmentId = filters.departmentId

  const response = await api.get(`/reports/${type}`, {
    params,
    ...withAuthConfig(token),
  })

  const payload = response.data?.data ?? response.data
  if (Array.isArray(payload)) return payload
  return payload?.items ?? payload ?? []
}

export async function fetchDepartments(token?: string) {
  const response = await api.get('/departments', withAuthConfig(token))
  const payload = response.data?.data ?? response.data
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.departments)) return payload.departments
  return []
}

export async function exportEmployeeReportCSV(filters: ReportsFilterParams, token?: string): Promise<Blob> {
  const params: Record<string, string> = {}
  if (filters.startDate) params.startDate = filters.startDate
  if (filters.endDate) params.endDate = filters.endDate
  if (filters.departmentId) params.departmentId = filters.departmentId
  params.format = 'csv'

  const response = await api.get('/reports/employees', {
    params,
    ...withAuthConfig(token),
    responseType: 'blob',
  })

  return response.data
}
