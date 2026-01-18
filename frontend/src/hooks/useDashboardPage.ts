'use client'

import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/store/useAuthStore'
import { PERMISSIONS } from '@/constants/permissions'
import { fetchDashboardMetrics } from '@/services/analytics/api'
import type { DashboardMetrics } from '@/services/analytics/types'
import type { DashboardStats, RecentActivity, UpcomingEvent } from '@/services/dashboard/types'
import { fetchDashboardRecentActivities, fetchDashboardStats, fetchUpcomingEvents } from '@/services/dashboard/api'

const FALLBACK_STATS: DashboardStats = {
  totalEmployees: 0,
  activeEmployees: 0,
  totalDepartments: 0,
  pendingLeaveRequests: 0,
  totalPayroll: 0,
  attendanceRate: 0,
}

interface UseDashboardPageOptions {
  initialStats: DashboardStats | null
  initialHasSession: boolean
  initialRecentActivities: RecentActivity[] | null
  initialUpcomingEvents: UpcomingEvent[] | null
}

export function useDashboardPage({
  initialStats,
  initialHasSession,
  initialRecentActivities,
  initialUpcomingEvents,
}: UseDashboardPageOptions) {
  const token = useAuthStore((state) => state.token)
  const user = useAuthStore((state) => state.user)
  const hasPermission = useAuthStore((state) => state.hasPermission)

  const [authGraceActive, setAuthGraceActive] = useState(() => initialHasSession)

  useEffect(() => {
    if (token || !initialHasSession) {
      setAuthGraceActive(false)
      return
    }
    const timeoutId = window.setTimeout(() => setAuthGraceActive(false), 1200)
    return () => window.clearTimeout(timeoutId)
  }, [token, initialHasSession])

  const isAuthHydrating = !token && (initialHasSession || authGraceActive)
  const isUserHydrating = !user && (initialHasSession || authGraceActive)

  const statsQuery = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: fetchDashboardStats,
    enabled: !!token,
    initialData: initialStats ?? FALLBACK_STATS,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: true,
    refetchOnMount: 'always',
    refetchInterval: 30_000,
  })

  const statsLoading = (isAuthHydrating && initialStats === null) || statsQuery.isLoading

  const canViewPeopleAnalytics = !!user && hasPermission(PERMISSIONS.VIEW_ANALYTICS)

  const peopleMetricsQuery = useQuery<DashboardMetrics | null>({
    queryKey: ['analytics-dashboard'],
    queryFn: async () => {
      const endDate = new Date()
      const startDate = new Date(endDate)
      startDate.setDate(endDate.getDate() - 30)
      const metrics = await fetchDashboardMetrics({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      })
      return metrics ?? null
    },
    enabled: !!token && canViewPeopleAnalytics,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchOnMount: 'always',
  })

  const recentActivitiesQuery = useQuery<RecentActivity[]>({
    queryKey: ['dashboard', 'recent-activities'],
    queryFn: fetchDashboardRecentActivities,
    enabled: !!token,
    ...(initialRecentActivities !== null ? { initialData: initialRecentActivities } : {}),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    refetchOnMount: 'always',
    refetchInterval: 30_000,
  })

  const upcomingEventsQuery = useQuery<UpcomingEvent[]>({
    queryKey: ['analytics-upcoming-events'],
    queryFn: fetchUpcomingEvents,
    enabled: !!token && canViewPeopleAnalytics,
    ...(initialUpcomingEvents !== null ? { initialData: initialUpcomingEvents } : {}),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchOnMount: 'always',
    refetchInterval: 60_000,
  })

  const recentActivities = recentActivitiesQuery.data ?? []
  const upcomingEvents = upcomingEventsQuery.data ?? []

  const shouldShowRecentActivitiesSkeleton =
    initialRecentActivities === null &&
    (isAuthHydrating || recentActivitiesQuery.isLoading) &&
    recentActivities.length === 0

  const shouldShowUpcomingEventsSkeleton =
    initialUpcomingEvents === null &&
    (isUserHydrating || upcomingEventsQuery.isLoading) &&
    upcomingEvents.length === 0

  const recentActivityTimestampFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: 'short',
        timeZone: 'UTC',
      }),
    []
  )

  const getActivityTimestamp = (value: string): string => value

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'leave':
        return '📅'
      case 'attendance':
        return '⏰'
      case 'payroll':
        return '💰'
      case 'employee':
        return '👤'
      default:
        return '📋'
    }
  }

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'review':
        return '📊'
      case 'leave':
        return '📅'
      case 'payroll':
        return '⏳'
      case 'deadline':
        return '⏳'
      default:
        return '📅'
    }
  }

  return {
    stats: statsQuery.data ?? FALLBACK_STATS,
    statsLoading,
    isUserHydrating,
    canViewPeopleAnalytics,
    peopleMetrics: peopleMetricsQuery.data,
    peopleMetricsLoading: peopleMetricsQuery.isLoading,
    recentActivities,
    upcomingEvents,
    shouldShowRecentActivitiesSkeleton,
    shouldShowUpcomingEventsSkeleton,
    getActivityTimestamp,
    getActivityIcon,
    getEventIcon,
  }
}
