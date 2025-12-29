import api from './axios'
import type {
  Applicant,
  Asset,
  AttendanceRecord,
  ComplianceLog,
  ComplianceRule,
  CreatePerformanceCyclePayload,
  CurrentUser,
  Department,
  Employee,
  EmployeeSummary,
  EmployeesPage,
  EmployeesPagination,
  JobPosting,
  LeaveRequest,
  ExpenseClaim,
  PayrollRecord,
  Permission,
  PerformanceReview,
  PerformanceSummaryRequest,
  PerformanceSummaryResponse,
  ReviewCycle,
  Role,
  SubmitPerformanceReviewPayload,
} from '@/types/hrm'

function withAuthConfig(token?: string) {
  return token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
}

const extractStatusCode = (error: unknown): number | undefined => {
  if (typeof error !== 'object' || error === null) {
    return undefined
  }
  const maybeResponse = (error as { response?: { status?: number } }).response
  return maybeResponse?.status
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
  } catch (error: unknown) {
    const status = extractStatusCode(error)
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

export type UpsertRolePayload = Partial<Role> & { permissionIds?: string[] }

export async function createRole(
  payload: UpsertRolePayload,
  token?: string,
): Promise<Role> {
  const response = await api.post('/roles', payload, withAuthConfig(token))
  const data = response.data?.data ?? response.data
  return data as Role
}

export async function updateRole(
  roleId: string,
  payload: UpsertRolePayload,
  token?: string,
): Promise<Role> {
  const response = await api.put(`/roles/${roleId}`, payload, withAuthConfig(token))
  const data = response.data?.data ?? response.data
  return data as Role
}

export async function deleteRoleById(
  roleId: string,
  token?: string,
): Promise<void> {
  await api.delete(`/roles/${roleId}`, withAuthConfig(token))
}

export interface UpsertEmployeePayload {
  firstName: string
  lastName: string
  email: string
  employeeNumber: string
  departmentId: string
  roleId: string
  hireDate: string
  salary: number
  status: 'active' | 'inactive' | 'terminated'
}

export async function createEmployee(
  payload: UpsertEmployeePayload,
  token?: string,
): Promise<Employee> {
  const response = await api.post('/employees', payload, withAuthConfig(token))
  const data = response.data?.data ?? response.data
  return data as Employee
}

export async function updateEmployee(
  employeeId: string,
  payload: Partial<UpsertEmployeePayload>,
  token?: string,
): Promise<Employee> {
  const response = await api.put(`/employees/${employeeId}`, payload, withAuthConfig(token))
  const data = response.data?.data ?? response.data
  return data as Employee
}

export async function deleteEmployeeById(
  employeeId: string,
  token?: string,
): Promise<void> {
  await api.delete(`/employees/${employeeId}`, withAuthConfig(token))
}

export interface InviteEmployeePayload {
  email: string
  roleId: string
}

export async function sendEmployeeInvite(
  payload: InviteEmployeePayload,
  token?: string,
): Promise<void> {
  await api.post('/auth/invite', payload, withAuthConfig(token))
}

export async function fetchEmployeesForManagers(token?: string): Promise<EmployeeSummary[]> {
  try {
    const response = await api.get('/employees', {
      params: { limit: 100 },
      ...withAuthConfig(token),
    })
    const payload = response.data
    const data = payload?.data ?? payload

    if (Array.isArray(data)) {
      return data as EmployeeSummary[]
    }

    if (typeof data === 'object' && data !== null) {
      const maybeEmployees = (data as { employees?: unknown }).employees
      if (Array.isArray(maybeEmployees)) {
        return maybeEmployees as EmployeeSummary[]
      }
    }

    return []
  } catch (error: unknown) {
    const status = extractStatusCode(error)
    if (status === 401 || status === 404) return []
    throw error
  }
}

export interface EmployeesFilterParams {
  page?: number
  limit?: number
  search?: string
  status?: string
  departmentId?: string
}

export async function fetchEmployees(
  params: EmployeesFilterParams,
  token?: string,
): Promise<EmployeesPage> {
  const page = params.page ?? 1
  const limit = params.limit ?? 9

  const query: Record<string, string | number> = {
    page,
    limit,
  }

  if (params.search) query.search = params.search
  if (params.status && params.status !== 'all') query.status = params.status
  if (params.departmentId && params.departmentId !== 'all') query.departmentId = params.departmentId

  try {
    const response = await api.get('/employees', {
      params: query,
      ...withAuthConfig(token),
    })

    const payload = response.data?.data ?? response.data

    if (!payload || typeof payload !== 'object') {
      return {
        employees: [],
        pagination: { page, limit, total: 0, pages: 0 },
      }
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
        : {
            page,
            limit,
            total: employees.length,
            pages: employees.length > 0 ? 1 : 0,
          }

    return { employees, pagination }
  } catch (error: unknown) {
    const status = extractStatusCode(error)
    if (status === 401 || status === 404) {
      return {
        employees: [],
        pagination: { page, limit, total: 0, pages: 0 },
      }
    }
    throw error
  }
}

export async function fetchAttendanceRecords(
  token?: string,
  limit = 30,
): Promise<AttendanceRecord[]> {
  try {
    const response = await api.get('/attendance', {
      params: { limit },
      ...withAuthConfig(token),
    })

    const payload = response.data?.data ?? response.data
    const root = Array.isArray(payload)
      ? payload
      : Array.isArray((payload as { items?: unknown }).items)
      ? (payload as { items: unknown[] }).items
      : []

    return Array.isArray(root) ? (root as AttendanceRecord[]) : []
  } catch (error: unknown) {
    const status = extractStatusCode(error)
    if (status === 401 || status === 404) return []
    throw error
  }
}

export interface ClockInPayload {
  latitude: number
  longitude: number
}

export async function clockIn(
  payload: ClockInPayload,
  token?: string,
): Promise<AttendanceRecord> {
  const response = await api.post('/attendance/check-in', payload, withAuthConfig(token))
  const data = response.data?.data ?? response.data
  return data as AttendanceRecord
}

export interface ClockOutPayload {
  attendanceId?: string
  latitude?: number
  longitude?: number
}

export async function clockOut(
  payload: ClockOutPayload,
  token?: string,
): Promise<AttendanceRecord> {
  const { attendanceId: _attendanceId, ...locationData } = payload
  const response = await api.post('/attendance/check-out', locationData, withAuthConfig(token))
  const data = response.data?.data ?? response.data
  return data as AttendanceRecord
}

export type UpsertDepartmentPayload = Partial<Department>

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

export async function fetchComplianceRules(token?: string): Promise<ComplianceRule[]> {
  try {
    const response = await api.get('/compliance/rules', withAuthConfig(token))
    const payload = response.data
    const root = (payload as { data?: unknown }).data ?? payload

    if (Array.isArray(root)) return root as ComplianceRule[]

    if (root && typeof root === 'object') {
      const dataField = (root as { data?: unknown; items?: unknown }).data
      const itemsField = (root as { data?: unknown; items?: unknown }).items

      if (Array.isArray(dataField)) return dataField as ComplianceRule[]
      if (Array.isArray(itemsField)) return itemsField as ComplianceRule[]

      const nestedData = (root as { data?: { data?: unknown } }).data
      if (nestedData && typeof nestedData === 'object') {
        const inner = (nestedData as { data?: unknown }).data
        if (Array.isArray(inner)) return inner as ComplianceRule[]
      }
    }

    return []
  } catch (error: unknown) {
    const status = extractStatusCode(error)
    if (status === 401 || status === 404) return []
    throw error
  }
}

export async function fetchComplianceLogs(token?: string): Promise<ComplianceLog[]> {
  try {
    const response = await api.get('/compliance/logs', withAuthConfig(token))
    const payload = response.data
    const root = (payload as { data?: unknown }).data ?? payload

    if (Array.isArray(root)) return root as ComplianceLog[]

    if (root && typeof root === 'object') {
      const dataField = (root as { data?: unknown; items?: unknown }).data
      const itemsField = (root as { data?: unknown; items?: unknown }).items

      if (Array.isArray(dataField)) return dataField as ComplianceLog[]
      if (Array.isArray(itemsField)) return itemsField as ComplianceLog[]

      const nestedData = (root as { data?: { data?: unknown } }).data
      if (nestedData && typeof nestedData === 'object') {
        const inner = (nestedData as { data?: unknown }).data
        if (Array.isArray(inner)) return inner as ComplianceLog[]
      }
    }

    return []
  } catch (error: unknown) {
    const status = extractStatusCode(error)
    if (status === 401 || status === 404) return []
    throw error
  }
}

export async function createComplianceRule(
  payload: Partial<ComplianceRule>,
  token?: string,
): Promise<ComplianceRule> {
  const response = await api.post('/compliance/rules', payload, withAuthConfig(token))
  const data = response.data?.data ?? response.data
  return data as ComplianceRule
}

export async function toggleComplianceRule(
  ruleId: string,
  token?: string,
): Promise<ComplianceRule | null> {
  const response = await api.patch(`/compliance/rules/${ruleId}/toggle`, undefined, withAuthConfig(token))
  const data = response.data?.data ?? response.data
  if (!data || typeof data !== 'object') return null
  return data as ComplianceRule
}

export interface ComplianceRunResult {
  message?: string
}

export async function runComplianceCheck(token?: string): Promise<ComplianceRunResult | null> {
  const response = await api.post('/compliance/run', undefined, withAuthConfig(token))
  const data = response.data?.data ?? response.data
  if (!data || typeof data !== 'object') return null
  return data as ComplianceRunResult
}

export interface AssetsFilterParams {
	status?: string
	search?: string
}

export async function fetchAssets(
	params: AssetsFilterParams,
	token?: string,
): Promise<Asset[]> {
	const query: Record<string, string> = {}
	if (params.status) query.status = params.status
	if (params.search) query.search = params.search

	try {
		const response = await api.get('/assets', {
			params: query,
			...withAuthConfig(token),
		})
		const payload = response.data
		const root = (payload as { data?: unknown }).data ?? payload

		if (Array.isArray(root)) return root as Asset[]

		const assets = (root as { assets?: unknown[] }).assets
		if (Array.isArray(assets)) return assets as Asset[]

		return []
	} catch (error: unknown) {
		const status = extractStatusCode(error)
		if (status === 401 || status === 404) return []
		throw error
	}
}

export interface UpsertAssetPayload {
	name: string
	serialNumber: string
	type: string
	purchaseDate: string
	purchasePrice?: number | null
	vendor?: string
	description?: string
}

export async function createAsset(
	payload: UpsertAssetPayload,
	token?: string,
): Promise<Asset> {
	const response = await api.post('/assets', payload, withAuthConfig(token))
	const data = response.data?.data ?? response.data
	return data as Asset
}

export async function updateAsset(
	assetId: string,
	payload: Partial<UpsertAssetPayload>,
	token?: string,
): Promise<Asset> {
	const response = await api.patch(`/assets/${assetId}`, payload, withAuthConfig(token))
	const data = response.data?.data ?? response.data
	return data as Asset
}

export interface AssignAssetPayload {
	employeeId: string
	notes?: string
}

export async function assignAsset(
	assetId: string,
	payload: AssignAssetPayload,
	token?: string,
): Promise<Asset> {
	const response = await api.post(`/assets/${assetId}/assign`, payload, withAuthConfig(token))
	const data = response.data?.data ?? response.data
	return data as Asset
}

export async function returnAsset(
	assetId: string,
	token?: string,
): Promise<Asset> {
	const response = await api.post(`/assets/${assetId}/return`, undefined, withAuthConfig(token))
	const data = response.data?.data ?? response.data
	return data as Asset
}

export interface LeaveFilterParams {
	status?: string
}

export async function fetchLeaveRequests(
	params: LeaveFilterParams,
	token?: string,
): Promise<LeaveRequest[]> {
	const query: Record<string, string> = {}
	if (params.status && params.status !== 'all') query.status = params.status

	try {
		const response = await api.get('/leave', {
			params: query,
			...withAuthConfig(token),
		})
		const payload = response.data?.data ?? response.data
		return Array.isArray(payload) ? (payload as LeaveRequest[]) : []
	} catch (error: unknown) {
		const status = extractStatusCode(error)
		if (status === 401 || status === 404) return []
		throw error
	}
}

export interface CreateLeavePayload {
	leaveType: string
	startDate: string
	endDate: string
	reason: string
}

export async function createLeaveRequest(
	payload: CreateLeavePayload,
	token?: string,
): Promise<LeaveRequest> {
	const response = await api.post('/leave', payload, withAuthConfig(token))
	const data = response.data?.data ?? response.data
	return data as LeaveRequest
}

export interface SubmitExpenseClaimPayload {
	employeeId: string
	amount: number
	currency?: string
	category: string
	date: string
	description?: string
	receiptUrl?: string
}

export async function submitExpenseClaim(
	payload: SubmitExpenseClaimPayload,
	token?: string,
): Promise<ExpenseClaim> {
	const response = await api.post('/expenses', payload, withAuthConfig(token))
	const data = response.data?.data ?? response.data
	return data as ExpenseClaim
}

export async function fetchMyExpenses(
	employeeId: string,
	token?: string,
): Promise<ExpenseClaim[]> {
	if (!employeeId) return []
	const response = await api.get(`/expenses/my/${employeeId}`, withAuthConfig(token))
	const data = response.data?.data ?? response.data
	return Array.isArray(data) ? (data as ExpenseClaim[]) : []
}

export async function fetchPendingExpenses(token?: string): Promise<ExpenseClaim[]> {
	const response = await api.get('/expenses/pending', withAuthConfig(token))
	const data = response.data?.data ?? response.data
	return Array.isArray(data) ? (data as ExpenseClaim[]) : []
}

export interface UpdateExpenseStatusPayload {
	status: 'approved' | 'rejected' | 'reimbursed'
	rejectionReason?: string
}

export async function updateExpenseStatus(
	expenseId: string,
	payload: UpdateExpenseStatusPayload,
	token?: string,
): Promise<ExpenseClaim> {
	const response = await api.patch(`/expenses/${expenseId}/status`, payload, withAuthConfig(token))
	const data = response.data?.data ?? response.data
	return data as ExpenseClaim
}

export async function approveLeave(
	leaveId: string,
	token?: string,
): Promise<LeaveRequest> {
	const response = await api.put(`/leave/${leaveId}/approve`, undefined, withAuthConfig(token))
	const data = response.data?.data ?? response.data
	return data as LeaveRequest
}

export async function rejectLeave(
	leaveId: string,
	token?: string,
): Promise<LeaveRequest> {
	const response = await api.put(`/leave/${leaveId}/reject`, undefined, withAuthConfig(token))
	const data = response.data?.data ?? response.data
	return data as LeaveRequest
}

export async function cancelLeave(
	leaveId: string,
	token?: string,
): Promise<LeaveRequest> {
	const response = await api.put(`/leave/${leaveId}/cancel`, undefined, withAuthConfig(token))
	const data = response.data?.data ?? response.data
	return data as LeaveRequest
}

export async function fetchPayrollRecords(token?: string): Promise<PayrollRecord[]> {
	try {
		const response = await api.get('/payroll', withAuthConfig(token))
		const payload = response.data
		const root = (payload as { data?: unknown }).data ?? payload ?? []

		if (Array.isArray(root)) return root as PayrollRecord[]

		const items = (root as { items?: unknown[] }).items
		if (Array.isArray(items)) return items as PayrollRecord[]

		const payrolls = (root as { payrolls?: unknown[] }).payrolls
		if (Array.isArray(payrolls)) return payrolls as PayrollRecord[]

		return []
	} catch (error: unknown) {
		const status = extractStatusCode(error)
		if (status === 401 || status === 404) return []
		throw error
	}
}

export async function generatePayroll(
	payPeriod: string,
	token?: string,
): Promise<void> {
	await api.post(
		'/payroll/generate',
		{ payPeriod },
		withAuthConfig(token),
	)
}

export async function updatePayrollStatus(
	payrollId: string,
	status: PayrollRecord['status'],
	token?: string,
): Promise<void> {
	await api.patch(
		`/payroll/${payrollId}/status`,
		{ status },
		withAuthConfig(token),
	)
}

export async function fetchRecruitmentJobs(token?: string): Promise<JobPosting[]> {
  const response = await api.get('/recruitment/jobs', withAuthConfig(token))
  const data = response.data?.data ?? response.data
  return Array.isArray(data) ? (data as JobPosting[]) : []
}

export async function fetchApplicantsByJob(jobId: string, token?: string): Promise<Applicant[]> {
  if (!jobId) return []
  const response = await api.get('/recruitment/applicants', {
    params: { jobId },
    ...withAuthConfig(token),
  })
  const data = response.data?.data ?? response.data
  return Array.isArray(data) ? (data as Applicant[]) : []
}

export async function updateApplicantStatus(applicantId: string, status: string): Promise<void> {
  await api.patch(`/recruitment/applicants/${applicantId}/status`, { status })
}

export async function fetchCurrentUser(token?: string): Promise<CurrentUser | null> {
  if (!token) return null
  const response = await api.get('/auth/me', withAuthConfig(token))
  const payload = response.data?.data ?? response.data
  if (!payload) return null
  const user = (payload as { user?: CurrentUser }).user ?? (payload as CurrentUser | null)
  return user ?? null
}

export async function fetchPerformanceCycles(token?: string): Promise<ReviewCycle[]> {
  const response = await api.get('/performance/cycles', withAuthConfig(token))
  const payload = response.data?.data ?? response.data
  return Array.isArray(payload) ? (payload as ReviewCycle[]) : []
}

export async function fetchPerformanceReviews(
	userId: string,
	token?: string,
): Promise<PerformanceReview[]> {
	if (!userId) return []
	const response = await api.get(`/performance/reviews/${userId}`, withAuthConfig(token))
	const payload = response.data?.data ?? response.data
	return Array.isArray(payload) ? (payload as PerformanceReview[]) : []
}

export async function createPerformanceCycle(
	data: CreatePerformanceCyclePayload,
	token?: string,
): Promise<ReviewCycle> {
	const response = await api.post('/performance/cycles', data, withAuthConfig(token))
	const payload = response.data?.data ?? response.data
	return payload as ReviewCycle
}

export async function submitPerformanceReview(
	payload: SubmitPerformanceReviewPayload,
	token?: string,
): Promise<PerformanceReview> {
	const response = await api.post('/performance/reviews', payload, withAuthConfig(token))
	const payloadData = response.data?.data ?? response.data
	return payloadData as PerformanceReview
}

export async function summarizePerformanceReviews(
	payload: PerformanceSummaryRequest,
	token?: string,
): Promise<PerformanceSummaryResponse> {
	const response = await api.post('/performance/reviews/summarize', payload, withAuthConfig(token))
	const payloadData = response.data?.data ?? response.data
	return (payloadData ?? {}) as PerformanceSummaryResponse
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
