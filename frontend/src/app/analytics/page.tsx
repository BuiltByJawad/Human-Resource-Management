import { cookies } from 'next/headers'

import { AnalyticsDashboardClient } from './AnalyticsDashboardClient'
import { getDashboardMetrics, getDepartmentStats, type DashboardMetrics, type DepartmentStat } from '@/features/analytics'

export default async function AnalyticsPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('accessToken')?.value ?? null

  const startDate = new Date(new Date().setDate(new Date().getDate() - 30)).toISOString()
  const endDate = new Date().toISOString()

  const [metrics, deptStats] = await Promise.all([
    token ? getDashboardMetrics({ startDate, endDate }, token ?? undefined) : null,
    token ? getDepartmentStats(token ?? undefined) : [],
  ])

  return (
    <AnalyticsDashboardClient
      initialMetrics={(metrics as DashboardMetrics | null) ?? null}
      initialDeptStats={(deptStats as DepartmentStat[]) ?? []}
    />
  )
}
