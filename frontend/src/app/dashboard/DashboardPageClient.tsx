"use client"

import { useMemo } from 'react'
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

interface RecentActivity {
  id: string
  type: 'leave' | 'attendance' | 'payroll' | 'employee'
  description: string
  timestamp: string
  employee: string
}

interface UpcomingEvent {
  id: string
  title: string
  date: string
  type: 'meeting' | 'review' | 'deadline' | string
}

interface DashboardPageClientProps {
  initialStats: DashboardStats | null
  canFetchStats: boolean
}

const FALLBACK_STATS: DashboardStats = {
  totalEmployees: 0,
  activeEmployees: 0,
  totalDepartments: 0,
  pendingLeaveRequests: 0,
  totalPayroll: 0,
  attendanceRate: 0
}

// Empty defaults; we prefer an explicit empty state over fake placeholder content.
const DEFAULT_ACTIVITIES: RecentActivity[] = []

const DEFAULT_EVENTS: UpcomingEvent[] = []

export function DashboardPageClient({ initialStats, canFetchStats }: DashboardPageClientProps) {
  const router = useRouter()
  const token = useAuthStore((state) => state.token)
  const user = useAuthStore((state) => state.user)
  const hasPermission = useAuthStore((state) => state.hasPermission)
  const { data: stats = FALLBACK_STATS, isLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats', token],
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
    enabled: canFetchStats && !!token,
    initialData: initialStats ?? FALLBACK_STATS,
    staleTime: 60 * 1000
  })

  const canViewPeopleAnalytics = !!user && hasPermission(PERMISSIONS.VIEW_ANALYTICS)

  const { data: peopleMetrics } = useQuery<DashboardMetrics | null>({
    queryKey: ['analytics-dashboard', token],
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
    staleTime: 5 * 60 * 1000,
  })

  // Recent Activities: fetch the latest leave requests and map them into
  // dashboard-friendly activity items. We reuse the same pattern as
  // PostLoginPrefetcher so this data can be prefetched after login.
  const { data: recentActivities = DEFAULT_ACTIVITIES } = useQuery<RecentActivity[]>({
    queryKey: ['dashboard', 'recent-activities', token],
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
    initialData: DEFAULT_ACTIVITIES,
    staleTime: 30_000,
  })
  const { data: upcomingEvents = DEFAULT_EVENTS } = useQuery<UpcomingEvent[]>({
    queryKey: ['analytics-upcoming-events', token],
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
    staleTime: 5 * 60 * 1000,
  })

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
              <StatsCard title="Total Employees" value={isLoading ? '...' : stats.totalEmployees} change="+12 this month" changeType="increase" icon={UsersIcon} />
              <StatsCard
                title="Active Employees"
                value={isLoading ? '...' : stats.activeEmployees}
                change={`${isLoading ? 0 : Math.round((stats.activeEmployees / (stats.totalEmployees || 1)) * 100)}% active rate`}
                changeType="increase"
                icon={UsersIcon}
              />
              <StatsCard title="Departments" value={isLoading ? '...' : stats.totalDepartments} icon={BuildingOfficeIcon} />
              <StatsCard title="Pending Leave" value={isLoading ? '...' : stats.pendingLeaveRequests} change="needs review" changeType="warning" icon={ExclamationTriangleIcon} />
              <StatsCard title="Monthly Payroll" value={isLoading ? '...' : `$${(stats.totalPayroll / 1000).toFixed(1)}k`} icon={BanknotesIcon} />
              <StatsCard title="Attendance Rate" value={isLoading ? '...' : `${stats.attendanceRate}%`} change="+2.1% this week" changeType="increase" icon={ChartBarIcon} />
            </div>

            {canViewPeopleAnalytics && peopleMetrics && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 items-stretch">
                <StatsCard
                  title="New Hires (30 days)"
                  value={peopleMetrics.newHires}
                  change={undefined}
                  icon={UsersIcon}
                />
                <StatsCard
                  title="Turnover Rate"
                  value={`${peopleMetrics.turnoverRate.toFixed(1)}%`}
                  change={undefined}
                  icon={UsersIcon}
                />
                <StatsCard
                  title="Average Salary"
                  value={`$${peopleMetrics.avgSalary.toLocaleString()}`}
                  change={undefined}
                  icon={BanknotesIcon}
                />
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card title="Recent Activities" className="lg:col-span-2">
                <div className="space-y-4">
                  {recentActivities.length === 0 ? (
                    <p className="text-sm text-gray-500">No recent activity yet.</p>
                  ) : (
                    recentActivities.map((activity) => (
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
                  {upcomingEvents.length === 0 ? (
                    <p className="text-sm text-gray-500">No upcoming events in the next 30 days.</p>
                  ) : (
                    upcomingEvents.map((event) => (
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
