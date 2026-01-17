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
