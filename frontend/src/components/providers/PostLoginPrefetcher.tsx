'use client'

import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import api from '@/lib/axios'
import { useAuthStore } from '@/store/useAuthStore'

interface DashboardStats {
  totalEmployees: number
  activeEmployees: number
  totalDepartments: number
  pendingLeaveRequests: number
  totalPayroll: number
  attendanceRate: number
}

interface DashboardRecentActivity {
  id: string
  type: 'leave' | 'attendance' | 'payroll' | 'employee'
  description: string
  timestamp: string
  employee: string
}

interface Pagination {
  page: number
  limit: number
  total: number
  pages: number
}

interface EmployeesResponse {
  employees: any[]
  pagination: Pagination
}

export function PostLoginPrefetcher() {
  const { isAuthenticated, token } = useAuthStore()
  const queryClient = useQueryClient()
  const didPrefetch = useRef(false)

  useEffect(() => {
    if (!isAuthenticated || !token || didPrefetch.current) return
    didPrefetch.current = true

    const prefetch = async () => {
      try {
        await Promise.all([
          // Dashboard stats
          queryClient.prefetchQuery<DashboardStats>({
            queryKey: ['dashboard-stats'],
            queryFn: async () => {
              const response = await api.get('/dashboard/stats')
              const raw = response.data?.data
              if (raw?.stats) return raw.stats as DashboardStats
              return (raw as DashboardStats) ?? {
                totalEmployees: 0,
                activeEmployees: 0,
                totalDepartments: 0,
                pendingLeaveRequests: 0,
                totalPayroll: 0,
                attendanceRate: 0,
              }
            },
            staleTime: 60_000,
          }),

          // Dashboard recent activities (leave requests)
          queryClient.prefetchQuery<DashboardRecentActivity[]>({
            queryKey: ['dashboard', 'recent-activities'],
            queryFn: async () => {
              const res = await api.get('/leave', { params: { limit: 8, page: 1 } })
              const raw = res.data?.data
              const leaveRequests = Array.isArray(raw) ? raw : raw?.leaveRequests ?? []
              return leaveRequests.map((leave: any) => ({
                id: leave.id ?? crypto.randomUUID(),
                type: 'leave' as const,
                description: leave.reason ? `requested leave: ${leave.reason}` : 'requested leave',
                timestamp: leave.createdAt ?? '',
                employee: `${leave.employee?.firstName ?? 'Employee'} ${leave.employee?.lastName ?? ''}`.trim() || 'Employee',
              }))
            },
            staleTime: 30_000,
          }),

          // Departments list (used in multiple places)
          queryClient.prefetchQuery<any[]>({
            queryKey: ['departments'],
            queryFn: async () => {
              const response = await api.get('/departments')
              const raw = response.data?.data
              if (Array.isArray(raw)) return raw
              if (Array.isArray(raw?.departments)) return raw.departments
              return []
            },
            staleTime: 5 * 60_000,
          }),

          // Roles list
          queryClient.prefetchQuery<any[]>({
            queryKey: ['roles'],
            queryFn: async () => {
              const response = await api.get('/roles')
              const raw = response.data?.data
              if (Array.isArray(raw)) return raw
              if (Array.isArray(raw?.roles)) return raw.roles
              return []
            },
            staleTime: 5 * 60_000,
          }),

          // Employees first page with default filters
          queryClient.prefetchQuery<EmployeesResponse>({
            queryKey: ['employees', 1, 9, '', 'all', 'all'],
            queryFn: async () => {
              const params: any = { page: 1, limit: 9 }
              const response = await api.get('/employees', { params })
              const raw = response.data?.data
              if (raw?.employees) return raw as EmployeesResponse
              if (Array.isArray(raw)) {
                return { employees: raw, pagination: { page: 1, limit: 9, total: raw.length, pages: 1 } }
              }
              return { employees: [], pagination: { page: 1, limit: 9, total: 0, pages: 0 } }
            },
            staleTime: 30_000,
          }),
        ])
      } catch {
        // Prefetch failures are non-fatal; navigation will still work with normal loading
      }
    }

    prefetch()
  }, [isAuthenticated, token, queryClient])

  return null
}
