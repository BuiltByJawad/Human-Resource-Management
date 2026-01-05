import api from '@/lib/axios'
import type { Department, UpsertDepartmentPayload } from '@/features/departments/types/departments.types'

const withAuthConfig = (token?: string) => (token ? { headers: { Authorization: `Bearer ${token}` } } : undefined)

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
  } catch (error: unknown) {
    const status = (error as { response?: { status?: number } })?.response?.status
    if (status === 401 || status === 404) return []
    throw error
  }
}

export async function createDepartment(
  payload: UpsertDepartmentPayload,
  token?: string,
): Promise<Department> {
  const response = await api.post('/departments', payload, withAuthConfig(token))
  const data = response.data?.data ?? response.data
  return data as Department
}

export async function updateDepartment(
  departmentId: string,
  payload: UpsertDepartmentPayload,
  token?: string,
): Promise<Department> {
  const response = await api.put(`/departments/${departmentId}`, payload, withAuthConfig(token))
  const data = response.data?.data ?? response.data
  return data as Department
}

export async function deleteDepartmentById(
  departmentId: string,
  token?: string,
): Promise<void> {
  await api.delete(`/departments/${departmentId}`, withAuthConfig(token))
}
