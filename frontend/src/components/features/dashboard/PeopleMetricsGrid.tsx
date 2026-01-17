import { UsersIcon, BanknotesIcon } from '@heroicons/react/24/outline'
import { StatsCard } from '@/components/ui/DataTable'
import type { DashboardMetrics } from '@/services/analytics/types'

interface PeopleMetricsGridProps {
  isHydrating: boolean
  canView: boolean
  loading: boolean
  metrics: DashboardMetrics | null | undefined
}

export function PeopleMetricsGrid({ isHydrating, canView, loading, metrics }: PeopleMetricsGridProps) {
  if (!isHydrating && !canView) return null

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 items-stretch">
      {isHydrating || (loading && !metrics) ? (
        <>
          <div className="h-24 bg-white rounded-xl border border-gray-100 shadow-sm animate-pulse" />
          <div className="h-24 bg-white rounded-xl border border-gray-100 shadow-sm animate-pulse" />
          <div className="h-24 bg-white rounded-xl border border-gray-100 shadow-sm animate-pulse" />
        </>
      ) : canView && metrics ? (
        <>
          <StatsCard title="New Hires (30 days)" value={metrics.newHires} change={undefined} icon={UsersIcon} />
          <StatsCard title="Turnover Rate" value={`${metrics.turnoverRate.toFixed(1)}%`} change={undefined} icon={UsersIcon} />
          <StatsCard title="Average Salary" value={`$${metrics.avgSalary.toLocaleString()}`} change={undefined} icon={BanknotesIcon} />
        </>
      ) : null}
    </div>
  )
}
