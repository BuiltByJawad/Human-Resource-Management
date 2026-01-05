export interface DashboardStats {
  totalEmployees: number
  activeEmployees: number
  totalDepartments: number
  pendingLeaveRequests: number
  totalPayroll: number
  attendanceRate: number
}

export type ActivityType = 'leave' | 'attendance' | 'payroll' | 'employee' | string

export interface RecentActivity {
  id: string
  type: ActivityType
  description: string
  timestamp: string
  employee: string
}
