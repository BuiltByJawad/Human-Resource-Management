export interface EmployeeDepartmentSummary {
  id: string
  name: string
}

export interface EmployeeRoleSummary {
  id: string
  name: string
}

export type EmployeeStatus = 'active' | 'inactive' | 'terminated'

export interface Employee {
  id: string
  employeeNumber: string
  firstName: string
  lastName: string
  email: string
  department: EmployeeDepartmentSummary | null
  role: EmployeeRoleSummary | null
  hireDate: string
  salary: number
  status: EmployeeStatus
  user?: { id: string; verified: boolean } | null
}

export interface EmployeesPagination {
  page: number
  limit: number
  total: number
  pages: number
}

export interface EmployeesPage {
  employees: Employee[]
  pagination: EmployeesPagination
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
  status: EmployeeStatus
}

export interface InviteEmployeePayload {
  email: string
  roleId: string
}

export interface EmployeeSummary {
  id: string
  firstName: string
  lastName: string
  email: string
}

export interface EmployeesFilterParams {
  page?: number
  limit?: number
  search?: string
  status?: string
  departmentId?: string
}
