'use client'

import type { ReactNode } from 'react'
import { createElement, useCallback, useMemo } from 'react'

import { ReportsTabContent } from '@/components/features/reports/ReportsTabContent'
import type { AttendanceReportData } from '@/components/features/reports/AttendanceSection'
import type { LeaveReportData } from '@/components/features/reports/LeaveSection'
import type { PayrollReportData } from '@/components/features/reports/PayrollSection'
import type { TabType } from '@/hooks/useReportsPage'
import type { ScheduledReport } from '@/services/reports/api'

interface UseReportsTabContentParams {
  activeTab: TabType
  isLoading: boolean
  isSchedulesLoading: boolean
  dashboardData: {
    metrics?: {
      totalEmployees?: number
      presentToday?: number
      pendingLeaves?: number
      monthlyPayroll?: number
    }
  } | null
  schedules: ScheduledReport[]
  employeesData: Array<Record<string, unknown>>
  attendanceData: AttendanceReportData | null
  leaveData: LeaveReportData | null
  payrollData: PayrollReportData | null
  startDate: Date | null
  endDate: Date | null
  departmentId: string
  departments: Array<{ value: string; label: string }>
  setStartDate: (value: Date | null) => void
  setEndDate: (value: Date | null) => void
  setDepartmentId: (value: string) => void
  onExportCSV: () => void
  onExportPDF: () => void
  onCreateSchedule: () => void
  onToggleEnabled: (id: string, isEnabled: boolean) => void
  onEditSchedule: (schedule: ScheduledReport) => void
  onScheduleHistory: (schedule: ScheduledReport) => void
  onRunNow: (id: string) => void
  onDeleteSchedule: (schedule: ScheduledReport) => void
  togglePendingId?: string
  runNowPendingId?: string
  deletePendingId?: string
}

export const useReportsTabContent = (
  params: UseReportsTabContentParams,
): {
  content: ReactNode
} => {
  const handleClearFilters = useCallback(() => {
    params.setStartDate(null)
    params.setEndDate(null)
    params.setDepartmentId('')
  }, [params])

  const content = useMemo(
    () =>
      createElement(ReportsTabContent, {
        activeTab: params.activeTab,
        isLoading: params.isLoading,
        isSchedulesLoading: params.isSchedulesLoading,
        dashboardData: params.dashboardData,
        schedules: params.schedules,
        employeesData: params.employeesData,
        attendanceData: params.attendanceData,
        leaveData: params.leaveData,
        payrollData: params.payrollData,
        startDate: params.startDate,
        endDate: params.endDate,
        departmentId: params.departmentId,
        departments: params.departments,
        onStartDateChange: params.setStartDate,
        onEndDateChange: params.setEndDate,
        onDepartmentChange: params.setDepartmentId,
        onClearFilters: handleClearFilters,
        onExportCSV: params.onExportCSV,
        onExportPDF: params.onExportPDF,
        onCreateSchedule: params.onCreateSchedule,
        onToggleEnabled: params.onToggleEnabled,
        onEditSchedule: params.onEditSchedule,
        onScheduleHistory: params.onScheduleHistory,
        onRunNow: params.onRunNow,
        onDeleteSchedule: params.onDeleteSchedule,
        togglePendingId: params.togglePendingId,
        runNowPendingId: params.runNowPendingId,
        deletePendingId: params.deletePendingId,
      }),
    [params, handleClearFilters],
  )

  return {
    content,
  }
}
