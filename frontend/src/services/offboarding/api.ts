import api from '@/lib/axios'
import type { OffboardingProcess, OffboardingTask } from '@/services/offboarding/types'

export interface OffboardingInitiatePayload {
  employeeId: string
  exitDate: string
  reason?: string
  notes?: string
}

export interface OffboardingEmployeeOption {
  id: string
  name: string
  email: string
}

interface AuthUser {
  permissions?: string[]
  employee?: { id?: string | null }
}

interface AuthMeResponse {
  user?: AuthUser
}

type ApiEnvelope<T> = { data?: T } | T

const buildApiBase = () =>
  process.env.BACKEND_URL ||
  (process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api$/, '') : null) ||
  'http://localhost:5000'

const fetchWithToken = async <T>(path: string, token: string | null, params?: URLSearchParams): Promise<T | null> => {
  if (!token) return null

  try {
    const base = buildApiBase()
    const url = params ? `${base}${path}?${params.toString()}` : `${base}${path}`
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    })

    if (!response.ok) return null

    const payload = (await response.json().catch(() => null)) as ApiEnvelope<T> | null
    if (!payload) return null
    return (payload as { data?: T }).data ?? (payload as T)
  } catch {
    return null
  }
}

export const fetchOffboardingProcesses = async (): Promise<OffboardingProcess[]> => {
  const res = await api.get('/offboarding')
  return res.data.data || res.data
}

export const initiateOffboarding = async (payload: OffboardingInitiatePayload): Promise<OffboardingProcess> => {
  const res = await api.post('/offboarding/initiate', payload)
  return res.data.data || res.data
}

export const updateOffboardingTaskStatus = async (
  taskId: string,
  payload: { status: OffboardingTask['status'] }
) => {
  const res = await api.patch(`/offboarding/tasks/${taskId}`, payload)
  return res.data.data || res.data
}

export const fetchEmployeeOffboarding = async (employeeId: string): Promise<OffboardingProcess> => {
  const res = await api.get(`/offboarding/${employeeId}`)
  return res.data.data || res.data
}

export const fetchOffboardingEmployees = async (): Promise<OffboardingEmployeeOption[]> => {
  const response = await api.get('/employees', { params: { limit: 200 } })
  const payload = response.data?.data ?? response.data ?? []
  const employees = Array.isArray(payload?.employees) ? payload.employees : Array.isArray(payload) ? payload : []
  return employees.map((emp: any) => ({
    id: emp.id,
    name: `${emp.firstName ?? ''} ${emp.lastName ?? ''}`.trim() || emp.email,
    email: emp.email,
  }))
}

export const fetchOffboardingPermissions = async (token: string | null): Promise<string[]> => {
  const payload = await fetchWithToken<AuthMeResponse>(`/api/auth/me`, token)
  const permissions = payload?.user?.permissions
  return Array.isArray(permissions) ? permissions : []
}

export const fetchOffboardingCurrentUser = async (token: string | null): Promise<AuthUser | null> => {
  const payload = await fetchWithToken<AuthMeResponse>(`/api/auth/me`, token)
  return payload?.user ?? null
}

export const fetchOffboardingProcessesServer = async (token: string | null): Promise<OffboardingProcess[]> => {
  const payload = await fetchWithToken<OffboardingProcess[]>(`/api/offboarding`, token)
  return Array.isArray(payload) ? payload : []
}

export const fetchOffboardingEmployeesServer = async (token: string | null): Promise<OffboardingEmployeeOption[]> => {
  const params = new URLSearchParams({ limit: '200' })
  const payload = await fetchWithToken<OffboardingEmployeeOption[] | { employees?: OffboardingEmployeeOption[] }>(
    `/api/employees`,
    token,
    params
  )

  if (!payload) return []
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload.employees)) return payload.employees
  return []
}

export const fetchOffboardingEmployeeProcess = async (
  employeeId: string | null,
  token: string | null
): Promise<OffboardingProcess | null> => {
  if (!employeeId) return null
  const payload = await fetchWithToken<OffboardingProcess>(`/api/offboarding/${employeeId}`, token)
  return payload ?? null
}
