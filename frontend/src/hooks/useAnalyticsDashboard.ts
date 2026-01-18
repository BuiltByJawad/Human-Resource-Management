'use client'

import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchDashboardMetrics, fetchDepartmentStats } from '@/services/analytics/api'
import type { DashboardMetrics, DepartmentStat } from '@/services/analytics/types'

interface UseAnalyticsDashboardOptions {
  initialMetrics: DashboardMetrics | null
  initialDeptStats: DepartmentStat[]
}

export function useAnalyticsDashboard({ initialMetrics, initialDeptStats }: UseAnalyticsDashboardOptions) {
  const [period, setPeriod] = useState('30')

  const metricsQuery = useQuery({
    queryKey: ['analytics-metrics', period],
    queryFn: () =>
      fetchDashboardMetrics({
        startDate: new Date(new Date().setDate(new Date().getDate() - Number(period))).toISOString(),
        endDate: new Date().toISOString(),
      }),
    initialData: initialMetrics ?? undefined,
  })

  const deptStatsQuery = useQuery({
    queryKey: ['analytics-departments'],
    queryFn: fetchDepartmentStats,
    initialData: initialDeptStats,
  })

  const deptStats = deptStatsQuery.data ?? []
  const totalDeptEmployees = useMemo(
    () => deptStats.reduce((acc, current) => acc + current._count.employees, 0),
    [deptStats]
  )

  const handleRefresh = () => {
    metricsQuery.refetch()
    deptStatsQuery.refetch()
  }

  return {
    period,
    setPeriod,
    metrics: metricsQuery.data,
    deptStats,
    metricsLoading: metricsQuery.isLoading,
    deptsLoading: deptStatsQuery.isLoading,
    handleRefresh,
    totalDeptEmployees,
  }
}
