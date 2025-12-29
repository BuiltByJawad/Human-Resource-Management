// Shared HRM domain types used by API helpers and UI components.
// NOTE: Keep this free of React/JSX and UI concerns.

export interface DepartmentManagerSummary {
  id: string
  firstName: string
  lastName: string
  email: string
}

export interface DepartmentParentSummary {
  id: string
  name: string
}

export interface DepartmentCounts {
  employees: number
  subDepartments: number
}

export interface Department {
  id: string
  name: string
  description?: string
  managerId?: string
  parentDepartmentId?: string
  manager?: DepartmentManagerSummary
  parentDepartment?: DepartmentParentSummary
  _count?: DepartmentCounts
}

export interface EmployeeSummary {
  id: string
  firstName: string
  lastName: string
  email: string
}

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

export interface AttendanceRecord {
  id: string
  checkIn: string
  checkOut?: string
  status: 'present' | 'absent' | 'late' | 'half_day'
  workHours?: number
  employee: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
}

export type AssetStatus = 'available' | 'assigned' | 'maintenance' | 'retired'

export interface AssetAssignment {
  id: string
  assetId: string
  employeeId: string
  assignedDate: string
  returnedDate?: string | null
  notes?: string
  employee: {
    id: string
    firstName: string
    lastName: string
    employeeNumber: string
  }
}

export interface MaintenanceLog {
  id: string
  assetId: string
  description: string
  cost?: number
  date: string
  performedBy?: string
}

export interface Asset {
  id: string
  name: string
  serialNumber: string
  type: string
  status: AssetStatus
  purchaseDate: string
  purchasePrice?: number
  vendor?: string
  description?: string
  assignments: AssetAssignment[]
  maintenance?: MaintenanceLog[]
}

export interface Permission {
  id: string
  resource: string
  action: string
  description?: string
}

export interface Role {
  id: string
  name: string
  description?: string
  isSystem: boolean
  permissions: { permission: Permission }[]
  _count?: {
    users: number
  }
}

export interface ComplianceRule {
  id: string
  name: string
  description?: string
  type: string
  threshold: number
  isActive: boolean
}

export interface ComplianceLogEmployeeDepartmentSummary {
  name: string
}

export interface ComplianceLogEmployeeSummary {
  firstName: string
  lastName: string
  department?: ComplianceLogEmployeeDepartmentSummary
}

export interface ComplianceLogRuleSummary {
  name: string
}

export interface ComplianceLog {
  id: string
  violationDate: string
  details: string
  status: string
  employee: ComplianceLogEmployeeSummary
  rule: ComplianceLogRuleSummary
}

export interface JobPosting {
  id: string
  title: string
  departmentId: string
  status: 'open' | 'closed' | 'draft'
  _count?: {
    applicants: number
  }
}

export type ApplicantStatus = 'applied' | 'screening' | 'interview' | 'offer' | 'hired' | 'rejected'

export interface Applicant {
  id: string
  jobId: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  resumeUrl?: string
  status: ApplicantStatus
  appliedDate: string
}

export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled'

export interface LeaveRequest {
  id: string
  leaveType: string
  startDate: string
  endDate: string
  reason: string
  status: LeaveStatus
  employee: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  approver?: {
    firstName: string
    lastName: string
  }
}

export type ExpenseStatus = 'pending' | 'approved' | 'rejected' | 'reimbursed'

export interface ExpenseClaim {
  id: string
  employeeId: string
  amount: number
  currency: string
  category: string
  date: string
  description?: string
  receiptUrl?: string
  status: ExpenseStatus
  rejectionReason?: string | null
  approvedBy?: string | null
}

export type PayrollStatus = 'draft' | 'processed' | 'paid' | 'error'

export interface PayrollRecord {
  id: string
  payPeriod: string
  netSalary: number
  baseSalary?: number
  allowances?: number
  allowancesBreakdown?: { name: string; amount: number }[]
  deductions?: number
  deductionsBreakdown?: { name: string; amount: number }[]
  status: PayrollStatus
  employee: {
    firstName: string
    lastName: string
    employeeNumber: string
    department?: {
      name: string
    }
  }
}

export interface ReviewCycle {
  id: string
  title: string
  startDate: string
  endDate: string
  status: string
}

export interface PerformanceReview {
  id: string
  cycleId: string
  ratings?: Record<string, number>
  comments?: string
}

export interface CreatePerformanceCyclePayload {
  title: string
  startDate: string
  endDate: string
}

export interface SubmitPerformanceReviewPayload {
  employeeId: string
  reviewerId: string
  cycleId: string
  type: string
  ratings: Record<string, number>
  comments: string
}

export interface PerformanceSummaryRequest {
  reviews: Array<{
    ratings?: Record<string, number>
    comments?: string
  }>
}

export interface PerformanceSummaryResponse {
  summary?: string
}

export interface CurrentUser {
  id: string
  email?: string | null
  firstName?: string | null
  lastName?: string | null
  role?: string | null
  avatarUrl?: string | null
  permissions?: string[]
  employee?: {
    id: string
  }
}
