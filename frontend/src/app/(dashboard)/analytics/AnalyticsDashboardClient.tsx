"use client"

import type { DashboardMetrics, DepartmentStat } from '@/services/analytics/types'
import { useAnalyticsDashboard } from '@/hooks/useAnalyticsDashboard'
import Sidebar from '@/components/ui/Sidebar'
import Header from '@/components/ui/Header'
import {
  AnalyticsHeader,
  AnalyticsKpiGrid,
  AnalyticsQuickActions,
  DepartmentDistributionCard,
} from '@/components/features/analytics'

interface AnalyticsDashboardClientProps {
  initialMetrics: DashboardMetrics | null
  initialDeptStats: DepartmentStat[]
}

export function AnalyticsDashboardClient({ initialMetrics, initialDeptStats }: AnalyticsDashboardClientProps) {
  const {
    period,
    setPeriod,
    metrics,
    deptStats,
    metricsLoading,
    deptsLoading,
    handleRefresh,
    totalDeptEmployees,
  } = useAnalyticsDashboard({ initialMetrics, initialDeptStats })

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            <AnalyticsHeader
              period={period}
              onPeriodChange={setPeriod}
              onRefresh={handleRefresh}
              isRefreshing={metricsLoading || deptsLoading}
            />

            <AnalyticsKpiGrid metrics={metrics ?? null} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <DepartmentDistributionCard deptStats={deptStats} totalEmployees={totalDeptEmployees} />
              <AnalyticsQuickActions />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
