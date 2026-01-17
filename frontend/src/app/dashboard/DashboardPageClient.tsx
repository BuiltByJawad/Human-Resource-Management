"use client"

import { useRouter } from 'next/navigation'

import Sidebar from '@/components/ui/Sidebar'
import Header from '@/components/ui/Header'
import {
  DashboardHeader,
  DashboardStatsGrid,
  PeopleMetricsGrid,
  RecentActivitiesCard,
  UpcomingEventsCard,
  QuickActions,
} from '@/components/features/dashboard'
import { useDashboardPage } from '@/hooks/useDashboardPage'
import type { DashboardStats, RecentActivity, UpcomingEvent } from '@/services/dashboard/types'

interface DashboardPageClientProps {
  initialStats: DashboardStats | null
  initialHasSession: boolean
  initialRecentActivities: RecentActivity[] | null
  initialUpcomingEvents: UpcomingEvent[] | null
}

export function DashboardPageClient({
  initialStats,
  initialHasSession,
  initialRecentActivities,
  initialUpcomingEvents,
}: DashboardPageClientProps) {
  const router = useRouter()
  const {
    stats,
    statsLoading,
    isUserHydrating,
    canViewPeopleAnalytics,
    peopleMetrics,
    peopleMetricsLoading,
    recentActivities,
    upcomingEvents,
    shouldShowRecentActivitiesSkeleton,
    shouldShowUpcomingEventsSkeleton,
    getActivityTimestamp,
    getActivityIcon,
    getEventIcon,
  } = useDashboardPage({
    initialStats,
    initialHasSession,
    initialRecentActivities,
    initialUpcomingEvents,
  })

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />

      <div className="flex-1 flex flex-col">
        <Header />

        <main className="flex-1 p-4 sm:p-6">
          <div className="max-w-7xl mx-auto w-full">
            <DashboardHeader
              title="Dashboard"
              subtitle="Welcome back! Here’s what’s happening in your organization."
            />

            <DashboardStatsGrid stats={stats} loading={statsLoading} />

            <PeopleMetricsGrid
              isHydrating={isUserHydrating}
              canView={canViewPeopleAnalytics}
              loading={peopleMetricsLoading}
              metrics={peopleMetrics}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <RecentActivitiesCard
                activities={recentActivities}
                showSkeleton={shouldShowRecentActivitiesSkeleton}
                getActivityIcon={getActivityIcon}
                getActivityTimestamp={getActivityTimestamp}
              />
              <UpcomingEventsCard
                events={upcomingEvents}
                showSkeleton={shouldShowUpcomingEventsSkeleton}
                getEventIcon={getEventIcon}
              />
            </div>

            <QuickActions onNavigate={(path) => router.push(path)} />
          </div>
        </main>
      </div>
    </div>
  )
}
