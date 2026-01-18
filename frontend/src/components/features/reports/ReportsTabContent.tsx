import type { JSX } from 'react'

import { ReportFiltersBar } from '@/components/features/reports/ReportFiltersBar'
import { OverviewStats } from '@/components/features/reports/OverviewStats'
import { EmployeesSection } from '@/components/features/reports/EmployeesSection'
import { AttendanceSection, type AttendanceReportData } from '@/components/features/reports/AttendanceSection'
import { LeaveSection, type LeaveReportData } from '@/components/features/reports/LeaveSection'
import { PayrollSection, type PayrollReportData } from '@/components/features/reports/PayrollSection'
import { SchedulesSection } from '@/components/features/reports/SchedulesSection'
import { LoadingSkeleton } from '@/components/features/reports/ReportStates'
import type { TabType } from '@/hooks/useReportsPage'
import type { ScheduledReport } from '@/services/reports/api'

interface ReportsTabContentProps {
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
  onStartDateChange: (value: Date | null) => void
  onEndDateChange: (value: Date | null) => void
  onDepartmentChange: (value: string) => void
  onClearFilters: () => void
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

export const ReportsTabContent = ({
  activeTab,
  isLoading,
  isSchedulesLoading,
  dashboardData,
  schedules,
  employeesData,
  attendanceData,
  leaveData,
  payrollData,
  startDate,
  endDate,
  departmentId,
  departments,
  onStartDateChange,
  onEndDateChange,
  onDepartmentChange,
  onClearFilters,
  onExportCSV,
  onExportPDF,
  onCreateSchedule,
  onToggleEnabled,
  onEditSchedule,
  onScheduleHistory,
  onRunNow,
  onDeleteSchedule,
  togglePendingId,
  runNowPendingId,
  deletePendingId,
}: ReportsTabContentProps): JSX.Element => {
  if (activeTab === 'overview') {
    if (isLoading) return <LoadingSkeleton />
    return (
      <OverviewStats
        totalEmployees={dashboardData?.metrics?.totalEmployees ?? 0}
        presentToday={dashboardData?.metrics?.presentToday ?? 0}
        pendingLeaves={dashboardData?.metrics?.pendingLeaves ?? 0}
        monthlyPayroll={dashboardData?.metrics?.monthlyPayroll ?? 0}
      />
    )
  }

  if (activeTab === 'schedules') {
    return (
      <SchedulesSection
        schedules={Array.isArray(schedules) ? schedules : []}
        isLoading={isSchedulesLoading}
        onCreate={onCreateSchedule}
        onToggleEnabled={onToggleEnabled}
        onEdit={onEditSchedule}
        onHistory={onScheduleHistory}
        onRunNow={onRunNow}
        onDelete={onDeleteSchedule}
        togglePendingId={togglePendingId}
        runNowPendingId={runNowPendingId}
        deletePendingId={deletePendingId}
      />
    )
  }

  const contentByTab: Record<Exclude<TabType, 'overview' | 'schedules'>, JSX.Element> = {
    employees: (
      <EmployeesSection
        data={employeesData}
        isLoading={isLoading}
        onExportCSV={onExportCSV}
        onExportPDF={onExportPDF}
      />
    ),
    attendance: (
      <AttendanceSection
        data={attendanceData}
        isLoading={isLoading}
        onExportCSV={onExportCSV}
        onExportPDF={onExportPDF}
      />
    ),
    leave: (
      <LeaveSection
        data={leaveData}
        isLoading={isLoading}
        onExportCSV={onExportCSV}
        onExportPDF={onExportPDF}
      />
    ),
    payroll: (
      <PayrollSection
        data={payrollData}
        isLoading={isLoading}
        onExportCSV={onExportCSV}
        onExportPDF={onExportPDF}
      />
    ),
  }

  return (
    <>
      <ReportFiltersBar
        startDate={startDate}
        endDate={endDate}
        departmentId={departmentId}
        onStartDateChange={onStartDateChange}
        onEndDateChange={onEndDateChange}
        onDepartmentChange={onDepartmentChange}
        departments={departments}
        onClear={onClearFilters}
      />
      {contentByTab[activeTab as Exclude<TabType, 'overview' | 'schedules'>]}
    </>
  )
}
