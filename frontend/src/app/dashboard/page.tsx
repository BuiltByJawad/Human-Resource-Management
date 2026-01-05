import { cookies } from 'next/headers'

import { DashboardPageClient } from './DashboardPageClient'
import { getDashboardStats, getRecentActivities, type DashboardStats, type RecentActivity } from '@/features/dashboard'
import { getUpcomingEvents, type UpcomingEvent } from '@/features/analytics'

export default async function DashboardPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('accessToken')?.value ?? null
  const refreshToken = cookieStore.get('refreshToken')?.value ?? null
  const initialHasSession = !!token || !!refreshToken

  const [initialStats, initialRecentActivities, initialUpcomingEvents] = await Promise.all([
    token ? getDashboardStats(token ?? undefined) : null,
    token ? getRecentActivities(token ?? undefined) : null,
    token ? getUpcomingEvents(token ?? undefined) : null,
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