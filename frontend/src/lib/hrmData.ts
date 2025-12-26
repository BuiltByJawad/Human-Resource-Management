import api from './axios'
import { Department } from '@/components/hrm/DepartmentComponents'
import { Role, Permission } from '@/components/hrm/RoleComponents'
import { ComplianceLog, ComplianceRule } from '@/components/hrm/ComplianceComponents'
import { JobPosting, Applicant } from '@/components/hrm/RecruitmentComponents'
import { ReviewCycle } from '@/components/hrm/performance'

function withAuthConfig(token?: string) {
  return token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
}

export async function fetchDepartments(token?: string): Promise<Department[]> {
  try {
    const response = await api.get('/departments', withAuthConfig(token))
    const payload = response.data
    const root = payload?.data ?? payload

    if (Array.isArray(root)) return root
    if (Array.isArray(root?.departments)) return root.departments
    if (Array.isArray(root?.data)) return root.data
    if (Array.isArray(payload?.departments)) return payload.departments
    return []
  } catch (error: any) {
    const status = error?.response?.status
    if (status === 401) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('Not authorized to fetch departments')
      }
      return []
    }
    if (status === 404) return []
    throw error
  }
}

export async function fetchEmployeesForManagers(token?: string): Promise<any[]> {
  try {
    const response = await api.get('/employees', {
      params: { limit: 100 },
      ...withAuthConfig(token),
    })
    const payload = response.data
    const data = payload?.data ?? payload
    if (Array.isArray(data)) return data
    if (Array.isArray(data?.employees)) return data.employees
    return []
  } catch (error: any) {
    const status = error?.response?.status
    if (status === 401 || status === 404) return []
    throw error
  }
}

export async function fetchRoles(): Promise<Role[]> {
  const response = await api.get('/roles')
  const payload = response.data
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload)) return payload
  return []
}

export async function fetchRolesWithToken(token?: string): Promise<Role[]> {
  try {
    const response = await api.get('/roles', withAuthConfig(token))
    const payload = response.data

    if (Array.isArray(payload?.data)) return payload.data
    if (Array.isArray(payload)) return payload

    const root = payload?.data ?? payload
    if (Array.isArray(root?.roles)) return root.roles
    if (Array.isArray(root?.data?.roles)) return root.data.roles
    if (Array.isArray(root?.data)) return root.data

    return []
  } catch (error: any) {
    const status = error?.response?.status
    if (status === 401) return []
    if (status === 404) return []
    throw error
  }
}

export async function fetchRolePermissions(token?: string): Promise<{
  permissions: Permission[]
  grouped: Record<string, Permission[]>
}> {
  try {
    const response = await api.get('/roles/permissions', withAuthConfig(token))
    const payload = response.data
    const permissions = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : []
    const grouped = payload?.grouped ?? {}
    if (!permissions.length && typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
      console.warn('[roles] /roles/permissions returned no permissions for current token')
    }
    return { permissions, grouped }
  } catch (error: any) {
    const status = error?.response?.status
    if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
      if (status === 401) console.warn('[roles] not authorized to fetch permissions (401)')
      if (status === 404) console.warn('[roles] permissions endpoint not found (404)')
    }
    if (status === 401 || status === 404) {
      return { permissions: [], grouped: {} }
    }
    throw error
  }
}

export async function fetchComplianceRules(): Promise<ComplianceRule[]> {
  const response = await api.get('/compliance/rules')
  const payload = response.data
  return Array.isArray(payload?.data) ? payload.data : []
}

export async function fetchComplianceLogs(): Promise<ComplianceLog[]> {
  const response = await api.get('/compliance/logs')
  const payload = response.data
  return Array.isArray(payload?.data) ? payload.data : []
}

export async function fetchRecruitmentJobs(token?: string): Promise<JobPosting[]> {
  const response = await api.get('/recruitment/jobs', withAuthConfig(token))
  const data = response.data?.data ?? response.data
  return Array.isArray(data) ? data : []
}

export async function fetchApplicantsByJob(jobId: string, token?: string): Promise<Applicant[]> {
  if (!jobId) return []
  const response = await api.get('/recruitment/applicants', {
    params: { jobId },
    ...withAuthConfig(token),
  })
  const data = response.data?.data ?? response.data
  return Array.isArray(data) ? data : []
}

export async function updateApplicantStatus(applicantId: string, status: string): Promise<void> {
  await api.patch(`/recruitment/applicants/${applicantId}/status`, { status })
}

export async function fetchPerformanceCycles(token?: string) {
  const response = await api.get('/performance/cycles', withAuthConfig(token))
  const payload = response.data?.data ?? response.data
  return Array.isArray(payload) ? payload : []
}

export async function fetchPerformanceReviews(userId: string, token?: string) {
  if (!userId) return []
  const response = await api.get(`/performance/reviews/${userId}`, withAuthConfig(token))
  const payload = response.data?.data ?? response.data
  return Array.isArray(payload) ? payload : []
}

export async function createPerformanceCycle(data: any, token?: string) {
  const response = await api.post('/performance/cycles', data, withAuthConfig(token))
  return response.data?.data ?? response.data
}

export async function submitPerformanceReview(payload: any, token?: string) {
  const response = await api.post('/performance/reviews', payload, withAuthConfig(token))
  return response.data?.data ?? response.data
}

export async function summarizePerformanceReviews(payload: any, token?: string) {
  const response = await api.post('/performance/reviews/summarize', payload, withAuthConfig(token))
  return response.data?.data ?? response.data
}

export interface ReportsFilterParams {
  startDate?: string | null
  endDate?: string | null
  departmentId?: string | null
}

export async function fetchReportsDashboard(token?: string) {
  const response = await api.get('/reports/dashboard', withAuthConfig(token))
  return response.data?.data ?? response.data
}

export async function fetchReportByType(
  type: 'employees' | 'attendance' | 'leave' | 'payroll',
  filters: ReportsFilterParams,
  token?: string
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
