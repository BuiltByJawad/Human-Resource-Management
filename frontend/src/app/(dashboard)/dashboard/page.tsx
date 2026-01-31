import { cookies } from 'next/headers'

import { DashboardPageClient } from './DashboardPageClient'
import {
  fetchDashboardRecentActivitiesServer,
  fetchDashboardStatsServer,
  fetchDashboardUpcomingEventsServer,
} from '@/services/dashboard/api'

export default async function DashboardPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('accessToken')?.value ?? null
  const refreshToken = cookieStore.get('refreshToken')?.value ?? null
  const initialHasSession = !!token || !!refreshToken
  const [initialStats, initialRecentActivities, initialUpcomingEvents] = await Promise.all([
    fetchDashboardStatsServer(token),
    fetchDashboardRecentActivitiesServer(token),
    fetchDashboardUpcomingEventsServer(token),
  ])

  return (
    <DashboardPageClient
      initialStats={initialStats}
      initialHasSession={initialHasSession}
      initialRecentActivities={initialRecentActivities}
      initialUpcomingEvents={initialUpcomingEvents}
    />
  )
}