export interface DashboardStats {
  totalEmployees: number
  activeEmployees: number
  totalDepartments: number
  pendingLeaveRequests: number
  totalPayroll: number
  attendanceRate: number
}

export interface RecentActivity {
  id: string
  type: 'leave' | 'attendance' | 'payroll' | 'employee'
  description: string
  timestamp: string
  employee: string
}

export interface UpcomingEvent {
  id: string
  title: string
  date: string
  type: 'meeting' | 'review' | 'deadline' | string
}
