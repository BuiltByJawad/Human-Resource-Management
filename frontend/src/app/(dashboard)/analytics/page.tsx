import { cookies } from 'next/headers'
import { AnalyticsDashboardClient } from './AnalyticsDashboardClient'
import { fetchDashboardMetricsServer, fetchDepartmentStatsServer } from '@/services/analytics/api'

export default async function AnalyticsPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('accessToken')?.value ?? null

  const startDate = new Date(new Date().setDate(new Date().getDate() - 30)).toISOString()
  const endDate = new Date().toISOString()

  const [metrics, deptStats] = await Promise.all([
    fetchDashboardMetricsServer(token, { startDate, endDate }),
    fetchDepartmentStatsServer(token),
  ])

  return <AnalyticsDashboardClient initialMetrics={metrics} initialDeptStats={deptStats} />
}
