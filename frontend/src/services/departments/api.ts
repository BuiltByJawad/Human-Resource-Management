import api from '@/lib/axios'
import type { Department, EmployeeSummary } from '@/types/hrm'

export const fetchDepartments = async (token?: string): Promise<Department[]> => {
  const res = await api.get('/departments', token ? { headers: { Authorization: `Bearer ${token}` } } : undefined)
  const payload = res.data
  const root = payload?.data ?? payload
  if (Array.isArray(root)) return root as Department[]
  if (Array.isArray(root?.departments)) return root.departments as Department[]
  if (Array.isArray(root?.data)) return root.data as Department[]
  if (Array.isArray(payload?.departments)) return payload.departments as Department[]
  return []
}

export type UpsertDepartmentPayload = Partial<Department>

export const createDepartment = async (payload: UpsertDepartmentPayload, token?: string): Promise<Department> => {
  const res = await api.post('/departments', payload, token ? { headers: { Authorization: `Bearer ${token}` } } : undefined)
  const data = res.data?.data ?? res.data
  return data as Department
}

export const updateDepartment = async (
  departmentId: string,
  payload: UpsertDepartmentPayload,
  token?: string
): Promise<Department> => {
  const res = await api.put(`/departments/${departmentId}`, payload, token ? { headers: { Authorization: `Bearer ${token}` } } : undefined)
  const data = res.data?.data ?? res.data
  return data as Department
}

export const deleteDepartment = async (departmentId: string, token?: string): Promise<void> => {
  await api.delete(`/departments/${departmentId}`, token ? { headers: { Authorization: `Bearer ${token}` } } : undefined)
}

export const fetchManagerSummaries = async (token?: string): Promise<EmployeeSummary[]> => {
  const res = await api.get('/employees', {
    params: { limit: 100 },
    ...(token ? { headers: { Authorization: `Bearer ${token}` } } : {}),
  })
  const payload = res.data
  const data = payload?.data ?? payload

  if (Array.isArray(data)) return data as EmployeeSummary[]
  if (typeof data === 'object' && data !== null) {
    const maybeEmployees = (data as { employees?: unknown }).employees
    if (Array.isArray(maybeEmployees)) {
      return maybeEmployees as EmployeeSummary[]
    }
  }
  return []
}
