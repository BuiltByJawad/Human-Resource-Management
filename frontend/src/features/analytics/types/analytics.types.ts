export interface DashboardMetrics {
  totalEmployees: number
  activeEmployees: number
  newHires: number
  turnoverRate: number
  avgSalary: number
}

export interface DepartmentStat {
  id: string
  name: string
  _count: { employees: number }
}

export interface UpcomingEvent {
  id: string
  title: string
  date: string
  type: string
}
