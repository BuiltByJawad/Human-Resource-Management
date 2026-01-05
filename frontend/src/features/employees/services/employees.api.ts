import api from '@/lib/axios'
import type {
  Employee,
  EmployeesFilterParams,
  EmployeesPage,
  EmployeesPagination,
  EmployeeSummary,
  InviteEmployeePayload,
  UpsertEmployeePayload,
} from '@/features/employees/types/employees.types'

const withAuthConfig = (token?: string) => (token ? { headers: { Authorization: `Bearer ${token}` } } : undefined)

const extractData = <T>(payload: unknown): T => {
  const root = (payload as { data?: unknown })?.data ?? payload
  return root as T
}

export async function fetchEmployees(
  params: EmployeesFilterParams,
  token?: string,
): Promise<EmployeesPage> {
  const page = params.page ?? 1
  const limit = params.limit ?? 9

  const query: Record<string, string | number> = { page, limit }
  if (params.search) query.search = params.search
  if (params.status && params.status !== 'all') query.status = params.status
  if (params.departmentId && params.departmentId !== 'all') query.departmentId = params.departmentId

  try {
    const response = await api.get('/employees', { params: query, ...withAuthConfig(token) })
    const payload = extractData<unknown>(response.data)

    if (!payload || typeof payload !== 'object') {
      return { employees: [], pagination: { page, limit, total: 0, pages: 0 } }
    }

    const employeesSource = (payload as { employees?: unknown }).employees
    const employees: Employee[] = Array.isArray(employeesSource)
      ? (employeesSource as Employee[])
      : Array.isArray(payload)
      ? (payload as Employee[])
      : []

    const maybePagination = (payload as { pagination?: unknown }).pagination
    const pagination: EmployeesPagination =
      maybePagination && typeof maybePagination === 'object'
        ? (maybePagination as EmployeesPagination)
        : { page, limit, total: employees.length, pages: employees.length > 0 ? 1 : 0 }

    return { employees, pagination }
  } catch (error: unknown) {
    const status = (error as { response?: { status?: number } })?.response?.status
    if (status === 401 || status === 404) {
      return { employees: [], pagination: { page, limit, total: 0, pages: 0 } }
    }
    throw error
  }
}

export async function fetchEmployeesForManagers(token?: string): Promise<EmployeeSummary[]> {
  try {
    const response = await api.get('/employees', {
      params: { limit: 100 },
      ...withAuthConfig(token),
    })
    const payload = response.data
    const data = payload?.data ?? payload

    if (Array.isArray(data)) return data as EmployeeSummary[]

    if (typeof data === 'object' && data !== null) {
      const maybeEmployees = (data as { employees?: unknown }).employees
      if (Array.isArray(maybeEmployees)) return maybeEmployees as EmployeeSummary[]
    }

    return []
  } catch (error: unknown) {
    const status = (error as { response?: { status?: number } })?.response?.status
    if (status === 401 || status === 404) return []
    throw error
  }
}

export async function createEmployee(payload: UpsertEmployeePayload, token?: string): Promise<Employee> {
  const response = await api.post('/employees', payload, withAuthConfig(token))
  return extractData<Employee>(response.data)
}

export async function updateEmployee(
  employeeId: string,
  payload: Partial<UpsertEmployeePayload>,
  token?: string,
): Promise<Employee> {
  const response = await api.put(`/employees/${employeeId}`, payload, withAuthConfig(token))
  return extractData<Employee>(response.data)
}

export async function deleteEmployeeById(employeeId: string, token?: string): Promise<void> {
  await api.delete(`/employees/${employeeId}`, withAuthConfig(token))
}

export async function sendEmployeeInvite(payload: InviteEmployeePayload, token?: string): Promise<void> {
  await api.post('/auth/invite', payload, withAuthConfig(token))
}
