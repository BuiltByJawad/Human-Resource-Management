"use client"

import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  UsersIcon,
  BuildingOfficeIcon,
  ClockIcon,
  BanknotesIcon,
  ChartBarIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

import Sidebar from '@/components/ui/Sidebar'
import Header from '@/components/ui/Header'
import { StatsCard } from '@/components/ui/DataTable'
import { Card } from '@/components/ui/FormComponents'
import api from '@/app/api/api'
import { useAuthStore } from '@/store/useAuthStore'
import { PERMISSIONS } from '@/constants/permissions'
import type { LeaveRequest } from '@/types/hrm'
import { analyticsService, type DashboardMetrics } from '@/services/analyticsService'
import { useRouter } from 'next/navigation'

export interface DashboardStats {
  totalEmployees: number
  activeEmployees: number
  totalDepartments: number
  pendingLeaveRequests: number
  totalPayroll: number
  attendanceRate: number
}

export interface RecentActivity {
  id: string
  type: 'leave' | 'attendance' | 'payroll' | 'employee'
  description: string
  timestamp: string
  employee: string
}

export interface UpcomingEvent {
  id: string
  title: string
  date: string
  type: 'meeting' | 'review' | 'deadline' | string
}

interface DashboardPageClientProps {
  initialStats: DashboardStats | null
  initialHasSession: boolean
  initialRecentActivities: RecentActivity[] | null
  initialUpcomingEvents: UpcomingEvent[] | null
}

const FALLBACK_STATS: DashboardStats = {
  totalEmployees: 0,
  activeEmployees: 0,
  totalDepartments: 0,
  pendingLeaveRequests: 0,
  totalPayroll: 0,
  attendanceRate: 0
}

// Empty defaults used only as type-safe fallbacks when queries have no data yet.
const DEFAULT_ACTIVITIES: RecentActivity[] = []

const DEFAULT_EVENTS: UpcomingEvent[] = []

export function DashboardPageClient({
  initialStats,
  initialHasSession,
  initialRecentActivities,
  initialUpcomingEvents,
}: DashboardPageClientProps) {
  const router = useRouter()
  const token = useAuthStore((state) => state.token)
  const user = useAuthStore((state) => state.user)
  const hasPermission = useAuthStore((state) => state.hasPermission)

  // When the page is refreshed, the auth store may be empty until rehydration
  // and/or refreshSession completes. During that window we show skeletons
  // immediately to prevent a brief empty-state flash.
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
  const { data: stats = FALLBACK_STATS, isLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await api.get('/dashboard/stats')
      const payload = response.data?.data ?? response.data
      const data = payload?.stats ?? payload ?? {}
      return {
        totalEmployees: Number(data.totalEmployees) || 0,
        activeEmployees: Number(data.activeEmployees) || 0,
        totalDepartments: Number(data.totalDepartments) || 0,
        pendingLeaveRequests: Number(data.pendingLeaveRequests) || 0,
        totalPayroll: Number(data.totalPayroll) || 0,
        attendanceRate: Number(data.attendanceRate) || 0
      }
    },
    enabled: !!token,
    initialData: initialStats ?? FALLBACK_STATS,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: true,
    refetchOnMount: 'always',
    refetchInterval: 30_000,
  })

  const hasInitialStats = initialStats !== null
  const statsLoading = (isAuthHydrating && !hasInitialStats) || isLoading

  const canViewPeopleAnalytics = !!user && hasPermission(PERMISSIONS.VIEW_ANALYTICS)

  const peopleMetricsQuery = useQuery<DashboardMetrics | null>({
    queryKey: ['analytics-dashboard'],
    queryFn: async () => {
      const endDate = new Date()
      const startDate = new Date(endDate)
      startDate.setDate(endDate.getDate() - 30)

      const metrics = await analyticsService.getDashboardMetrics({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      })

      return metrics ?? null
    },
    enabled: !!token && canViewPeopleAnalytics,
    // Events change less frequently, so we can cache them a bit longer.
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchOnMount: 'always',
  })

  const recentActivitiesQuery = useQuery<RecentActivity[]>({
    queryKey: ['dashboard', 'recent-activities'],
    queryFn: async () => {
      const res = await api.get('/leave', { params: { limit: 8, page: 1 } })
      const raw = res.data?.data
      const leaveRequests = (Array.isArray(raw) ? raw : raw?.leaveRequests ?? []) as (LeaveRequest & {
        createdAt?: string | null
        employee?: { firstName?: string | null; lastName?: string | null } | null
      })[]

      return leaveRequests.map((leave) => {
        const createdAt = leave.createdAt ? new Date(leave.createdAt) : null
        const timestamp = createdAt
          ? createdAt.toLocaleString(undefined, {
              hour: '2-digit',
              minute: '2-digit',
              day: '2-digit',
              month: 'short',
            })
          : ''

        const employeeName = `${leave.employee?.firstName ?? 'Employee'} ${
          leave.employee?.lastName ?? ''
        }`.trim() || 'Employee'

        return {
          id: leave.id ?? crypto.randomUUID(),
          type: 'leave' as const,
          description: leave.reason ? `requested leave: ${leave.reason}` : 'requested leave',
          timestamp,
          employee: employeeName,
        }
      })
    },
    enabled: !!token,
    ...(initialRecentActivities !== null ? { initialData: initialRecentActivities } : {}),
    // Keep results warm for a short period so navigation back to the dashboard
    // can reuse cached data instead of re-skeletonizing immediately.
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    refetchOnMount: 'always',
    refetchInterval: 30_000,
  })

  const upcomingEventsQuery = useQuery<UpcomingEvent[]>({
    queryKey: ['analytics-upcoming-events'],
    queryFn: async () => {
      const events = await analyticsService.getUpcomingEvents()
      return events.map((event) => ({
        ...event,
        // Ensure date is a human-readable string; backend returns ISO timestamps.
        date: new Date(event.date).toLocaleString(undefined, {
          day: '2-digit',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        }),
      })) as UpcomingEvent[]
    },
    enabled: !!token && canViewPeopleAnalytics,
    ...(initialUpcomingEvents !== null ? { initialData: initialUpcomingEvents } : {}),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchOnMount: 'always',
    refetchInterval: 60_000,
  })

  // Derive data only after queries exist to avoid ReferenceErrors.
  const recentActivities = recentActivitiesQuery.data ?? DEFAULT_ACTIVITIES
  const upcomingEvents = upcomingEventsQuery.data ?? DEFAULT_EVENTS

  const hasKnownRecentActivities = initialRecentActivities !== null
  const hasKnownUpcomingEvents = initialUpcomingEvents !== null

  const shouldShowRecentActivitiesSkeleton =
    !hasKnownRecentActivities &&
    (isAuthHydrating || recentActivitiesQuery.isLoading) &&
    recentActivities.length === 0

  const shouldShowUpcomingEventsSkeleton =
    !hasKnownUpcomingEvents &&
    (isUserHydrating || upcomingEventsQuery.isLoading) &&
    upcomingEvents.length === 0

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

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />

      <div className="flex-1 flex flex-col">
        <Header />

        <main className="flex-1 p-4 sm:p-6">
          <div className="max-w-7xl mx-auto w-full">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600">Welcome back! Here’s what’s happening in your organization.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8 items-stretch">
              <StatsCard title="Total Employees" value={statsLoading ? '...' : stats.totalEmployees} change="+12 this month" changeType="increase" icon={UsersIcon} />
              <StatsCard
                title="Active Employees"
                value={statsLoading ? '...' : stats.activeEmployees}
                change={`${statsLoading ? 0 : Math.round((stats.activeEmployees / (stats.totalEmployees || 1)) * 100)}% active rate`}
                changeType="increase"
                icon={UsersIcon}
              />
              <StatsCard title="Departments" value={statsLoading ? '...' : stats.totalDepartments} icon={BuildingOfficeIcon} />
              <StatsCard title="Pending Leave" value={statsLoading ? '...' : stats.pendingLeaveRequests} change="needs review" changeType="warning" icon={ExclamationTriangleIcon} />
              <StatsCard title="Monthly Payroll" value={statsLoading ? '...' : `$${(stats.totalPayroll / 1000).toFixed(1)}k`} icon={BanknotesIcon} />
              <StatsCard title="Attendance Rate" value={statsLoading ? '...' : `${stats.attendanceRate}%`} change="+2.1% this week" changeType="increase" icon={ChartBarIcon} />
            </div>

            {(isUserHydrating || canViewPeopleAnalytics) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 items-stretch">
                {isUserHydrating || (peopleMetricsQuery.isLoading && !peopleMetricsQuery.data) ? (
                  <>
                    <div className="h-24 bg-white rounded-xl border border-gray-100 shadow-sm animate-pulse" />
                    <div className="h-24 bg-white rounded-xl border border-gray-100 shadow-sm animate-pulse" />
                    <div className="h-24 bg-white rounded-xl border border-gray-100 shadow-sm animate-pulse" />
                  </>
                ) : canViewPeopleAnalytics && peopleMetricsQuery.data ? (
                  <>
                    <StatsCard
                      title="New Hires (30 days)"
                      value={peopleMetricsQuery.data.newHires}
                      change={undefined}
                      icon={UsersIcon}
                    />
                    <StatsCard
                      title="Turnover Rate"
                      value={`${peopleMetricsQuery.data.turnoverRate.toFixed(1)}%`}
                      change={undefined}
                      icon={UsersIcon}
                    />
                    <StatsCard
                      title="Average Salary"
                      value={`$${peopleMetricsQuery.data.avgSalary.toLocaleString()}`}
                      change={undefined}
                      icon={BanknotesIcon}
                    />
                  </>
                ) : null}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card title="Recent Activities" className="lg:col-span-2">
                <div className="space-y-4">
                  {shouldShowRecentActivitiesSkeleton ? (
                    // Skeleton while the first page of activities is loading.
                    Array.from({ length: 4 }).map((_, index) => (
                      <div
                        key={index}
                        className="flex items-start space-x-3 p-3 rounded-lg animate-pulse"
                      >
                        <div className="w-8 h-8 rounded-full bg-gray-200" />
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="h-3 bg-gray-200 rounded w-3/4" />
                          <div className="h-3 bg-gray-100 rounded w-1/3" />
                        </div>
                      </div>
                    ))
                  ) : recentActivities.length === 0 ? (
                    <p className="text-sm text-gray-500">No recent activity yet.</p>
                  ) : (
                    recentActivities.map((activity: RecentActivity) => (
                      <div key={activity.id} className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg">
                        <div className="text-2xl">{getActivityIcon(activity.type)}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900">
                            <span className="font-medium">{activity.employee}</span> {activity.description}
                          </p>
                          <p className="text-xs text-gray-500">{activity.timestamp}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>

              <Card title="Upcoming Events">
                <div className="space-y-4">
                  {shouldShowUpcomingEventsSkeleton ? (
                    // Skeleton while loading upcoming events for the first time.
                    Array.from({ length: 3 }).map((_, index) => (
                      <div
                        key={index}
                        className="flex items-start space-x-3 p-3 rounded-lg animate-pulse"
                      >
                        <div className="w-8 h-8 rounded-full bg-gray-200" />
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="h-3 bg-gray-200 rounded w-2/3" />
                          <div className="h-3 bg-gray-100 rounded w-1/3" />
                        </div>
                      </div>
                    ))
                  ) : upcomingEvents.length === 0 ? (
                    <p className="text-sm text-gray-500">No upcoming events in the next 30 days.</p>
                  ) : (
                    upcomingEvents.map((event: UpcomingEvent) => (
                      <div key={event.id} className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg">
                        <div className="text-2xl">{getEventIcon(event.type)}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">{event.title}</p>
                          <p className="text-xs text-gray-500">{event.date}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </div>

            <div className="mt-8">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button
                  className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow text-center"
                  type="button"
                  onClick={() => router.push('/employees?new=1')}
                >
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <UsersIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-900">Add Employee</span>
                </button>
                <button
                  className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow text-center"
                  type="button"
                  onClick={() => router.push('/departments')}
                >
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <BuildingOfficeIcon className="h-6 w-6 text-green-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-900">Add Department</span>
                </button>
                <button
                  className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow text-center"
                  type="button"
                  onClick={() => router.push('/payroll')}
                >
                  <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <ClockIcon className="h-6 w-6 text-yellow-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-900">Process Payroll</span>
                </button>
                <button
                  className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow text-center"
                  type="button"
                  onClick={() => router.push('/reports')}
                >
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <ChartBarIcon className="h-6 w-6 text-purple-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-900">View Reports</span>
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
