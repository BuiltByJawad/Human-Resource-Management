export interface User {
  id: string
  email: string
  role: 'super_admin' | 'hr_admin' | 'manager' | 'employee'
  isActive: boolean
  lastLogin?: Date
  createdAt: Date
  updatedAt: Date
}

export interface Employee {
  id: string
  employeeNumber: string
  firstName: string
  lastName: string
  email: string
  departmentId?: string
  roleId?: string
  managerId?: string
  hireDate: Date
  salary: number
  status: 'active' | 'inactive' | 'terminated'
  createdAt: Date
  updatedAt: Date
  department?: Department
  role?: Role
  manager?: Employee
}

export interface Department {
  id: string
  name: string
  description?: string
  managerId?: string
  parentDepartmentId?: string
  createdAt: Date
  updatedAt: Date
  manager?: Employee
  parentDepartment?: Department
}

export interface Role {
  id: string
  name: string
  description?: string
  permissions: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

export interface Attendance {
  id: string
  employeeId: string
  checkIn: Date
  checkOut?: Date
  workHours?: number
  overtimeHours?: number
  status: 'present' | 'absent' | 'late' | 'half_day'
  createdAt: Date
  employee?: Employee
}

export interface LeaveRequest {
  id: string
  employeeId: string
  approverId?: string
  leaveType: 'annual' | 'sick' | 'personal' | 'maternity' | 'paternity'
  startDate: Date
  endDate: Date
  daysRequested: number
  status: 'pending' | 'approved' | 'rejected'
  reason?: string
  createdAt: Date
  updatedAt: Date
  employee?: Employee
  approver?: Employee
}

export interface PayrollRecord {
  id: string
  employeeId: string
  payPeriod: string
  baseSalary: number
  allowances: number
  deductions: number
  netSalary: number
  status: 'draft' | 'processed' | 'paid'
  processedAt?: Date
  createdAt: Date
  employee?: Employee
}

export interface PerformanceReview {
  id: string
  employeeId: string
  reviewerId: string
  reviewPeriod: string
  goals: Record<string, any>
  ratings: Record<string, any>
  comments?: string
  status: 'draft' | 'submitted' | 'approved'
  createdAt: Date
  updatedAt: Date
  employee?: Employee
  reviewer?: Employee
}

export interface Document {
  id: string
  employeeId: string
  fileName: string
  fileType: string
  filePath: string
  version: number
  metadata: Record<string, any>
  createdAt: Date
  updatedAt: Date
  employee?: Employee
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface LoginRequest {
  email: string
  password: string
  rememberMe?: boolean
}

export interface LoginResponse {
  accessToken: string
  refreshToken: string
  user: User
  permissions: string[]
}

import { Request } from 'express'

export interface AuthRequest extends Request {
  user?: User
}