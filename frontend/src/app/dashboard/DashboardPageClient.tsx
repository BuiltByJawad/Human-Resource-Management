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

const DEFAULT_ACTIVITIES: RecentActivity[] = [
  { id: '1', type: 'leave', description: 'requested 3 days leave', timestamp: '2 hours ago', employee: 'John Smith' },
  { id: '2', type: 'attendance', description: 'checked in late', timestamp: '3 hours ago', employee: 'Sarah Johnson' },
  { id: '3', type: 'payroll', description: 'payroll processed for October', timestamp: '1 day ago', employee: 'System' },
  { id: '4', type: 'employee', description: 'new employee onboarded', timestamp: '2 days ago', employee: 'Michael Brown' }
]

const DEFAULT_EVENTS: UpcomingEvent[] = [
  { id: '1', title: 'Team Meeting', date: 'Today, 2:00 PM', type: 'meeting' },
  { id: '2', title: 'Performance Reviews', date: 'Tomorrow', type: 'review' },
  { id: '3', title: 'Payroll Deadline', date: 'Nov 25, 2024', type: 'deadline' }
]

export function DashboardPageClient({ initialStats, canFetchStats }: DashboardPageClientProps) {
  const token = useAuthStore((state) => state.token)
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

  const recentActivities = useMemo(() => DEFAULT_ACTIVITIES, [])
  const upcomingEvents = useMemo(() => DEFAULT_EVENTS, [])

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
      case 'meeting':
        return '👥'
      case 'review':
        return '📊'
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card title="Recent Activities" className="lg:col-span-2">
                <div className="space-y-4">
                  {recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg">
                      <div className="text-2xl">{getActivityIcon(activity.type)}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900">
                          <span className="font-medium">{activity.employee}</span> {activity.description}
                        </p>
                        <p className="text-xs text-gray-500">{activity.timestamp}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card title="Upcoming Events">
                <div className="space-y-4">
                  {upcomingEvents.map((event) => (
                    <div key={event.id} className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg">
                      <div className="text-2xl">{getEventIcon(event.type)}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{event.title}</p>
                        <p className="text-xs text-gray-500">{event.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            <div className="mt-8">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <UsersIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-900">Add Employee</span>
                </button>
                <button className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <BuildingOfficeIcon className="h-6 w-6 text-green-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-900">Add Department</span>
                </button>
                <button className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow text-center">
                  <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <ClockIcon className="h-6 w-6 text-yellow-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-900">Process Payroll</span>
                </button>
                <button className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow text-center">
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
