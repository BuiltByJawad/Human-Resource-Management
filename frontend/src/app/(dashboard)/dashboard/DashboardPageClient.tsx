"use client"

import { useRouter } from 'next/navigation'

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
    <div className="p-4 md:p-6">
      <div className="max-w-7xl mx-auto w-full">
        <DashboardHeader
          title="Dashboard"
          subtitle="Welcome back! Here’s what’s happening in your workspace."
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
    </div>
  )
}
