import {
  UsersIcon,
  BuildingOfficeIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  BanknotesIcon,
} from '@heroicons/react/24/outline'
import { StatsCard } from '@/components/ui/DataTable'
import type { DashboardStats } from '@/services/dashboard/types'

interface DashboardStatsGridProps {
  stats: DashboardStats
  loading: boolean
}

export function DashboardStatsGrid({ stats, loading }: DashboardStatsGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8 items-stretch">
      <StatsCard title="Total Employees" value={loading ? '...' : stats.totalEmployees} change="+12 this month" changeType="increase" icon={UsersIcon} />
      <StatsCard
        title="Active Employees"
        value={loading ? '...' : stats.activeEmployees}
        change={`${loading ? 0 : Math.round((stats.activeEmployees / (stats.totalEmployees || 1)) * 100)}% active rate`}
        changeType="increase"
        icon={UsersIcon}
      />
      <StatsCard title="Departments" value={loading ? '...' : stats.totalDepartments} icon={BuildingOfficeIcon} />
      <StatsCard title="Pending Leave" value={loading ? '...' : stats.pendingLeaveRequests} change="needs review" changeType="warning" icon={ExclamationTriangleIcon} />
      <StatsCard title="Monthly Payroll" value={loading ? '...' : `$${(stats.totalPayroll / 1000).toFixed(1)}k`} icon={BanknotesIcon} />
      <StatsCard title="Attendance Rate" value={loading ? '...' : `${stats.attendanceRate}%`} change="+2.1% this week" changeType="increase" icon={ChartBarIcon} />
    </div>
  )
}
