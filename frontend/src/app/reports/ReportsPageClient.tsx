"use client"

import type { JSX } from 'react'

import DashboardShell from '@/components/ui/DashboardShell'
import {
  LoadingSkeleton,
  ErrorState,
} from '@/components/features/reports/ReportStates'
import { ReportsHeader } from '@/components/features/reports/ReportsHeader'
import { ReportsTabs } from '@/components/features/reports/ReportsTabs'
import { ReportFiltersBar } from '@/components/features/reports/ReportFiltersBar'
import { OverviewStats } from '@/components/features/reports/OverviewStats'
import { EmployeesSection } from '@/components/features/reports/EmployeesSection'
import { AttendanceSection } from '@/components/features/reports/AttendanceSection'
import { LeaveSection } from '@/components/features/reports/LeaveSection'
import { PayrollSection } from '@/components/features/reports/PayrollSection'
import { SchedulesSection } from '@/components/features/reports/SchedulesSection'
import { ScheduleFormModal } from '@/components/features/reports/ScheduleFormModal'
import { ScheduleDeleteModal } from '@/components/features/reports/ScheduleDeleteModal'
import { ScheduleHistoryModal } from '@/components/features/reports/ScheduleHistoryModal'
import { employeeColumns, attendanceColumns, leaveColumns, payrollColumns } from '@/components/features/reports/columns'
import {
  useReportsPage,
  type ReportsPageProps,
  type TabType,
} from '@/hooks/useReportsPage'
import type { ScheduledReportRecipientUser } from '@/services/reports/api'

export default function ReportsPageClient({ initialDashboardData, initialDepartments }: ReportsPageProps) {
  const {
    activeTab,
    handleTabChange,
    startDate,
    endDate,
    departmentId,
    departments,
    setStartDate,
    setEndDate,
    setDepartmentId,
    dashboardData,
    isLoading,
    isSchedulesLoading,
    employeesData,
    attendanceData,
    leaveData,
    payrollData,
    schedules,
    recipients,
    scheduleModalOpen,
    scheduleForm,
    setScheduleForm,
    editingSchedule,
    openCreateSchedule,
    openEditSchedule,
    submitSchedule,
    onCloseScheduleModal,
    scheduleHistoryOpen,
    scheduleHistorySchedule,
    setScheduleHistoryOpen,
    setScheduleHistorySchedule,
    deleteScheduleOpen,
    setDeleteScheduleOpen,
    deleteScheduleTarget,
    setDeleteScheduleTarget,
    onDeleteSchedule,
    onToggleRecipient,
    onToggleEnabled,
    onRunNow,
    onExportCSV,
    onExportPDF,
    error,
    setError,
    runNowMutation,
    toggleEnabledMutation,
    createScheduleLoading,
    updateScheduleLoading,
    recipientsLoading,
    refetchDashboard,
    refetchReport,
    refetchSchedules,
    deleteScheduleLoading,
    deleteScheduleMutation,
  } = useReportsPage({ initialDashboardData, initialDepartments })

  const handleClearFilters = () => {
    setStartDate(null)
    setEndDate(null)
    setDepartmentId('')
  }

  const renderContentByTab = () => {
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
          onCreate={openCreateSchedule}
          onToggleEnabled={onToggleEnabled}
          onEdit={openEditSchedule}
          onHistory={(schedule) => {
            setScheduleHistorySchedule(schedule)
            setScheduleHistoryOpen(true)
          }}
          onRunNow={onRunNow}
          onDelete={(schedule) => {
            setDeleteScheduleTarget(schedule)
            setDeleteScheduleOpen(true)
          }}
          togglePendingId={toggleEnabledMutation.variables?.id}
          runNowPendingId={runNowMutation.variables as string | undefined}
          deletePendingId={deleteScheduleMutation.variables as string | undefined}
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
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          onDepartmentChange={setDepartmentId}
          departments={departments}
          onClear={handleClearFilters}
        />
        {contentByTab[activeTab as Exclude<TabType, 'overview' | 'schedules'>]}
      </>
    )
  }

  return (
    <DashboardShell>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <ReportsHeader
            title="Reports & Analytics"
            subtitle="Monitor workforce metrics, export datasets, and manage scheduled deliveries."
          />

          <ReportsTabs
            activeTab={activeTab}
            onChange={(tab) => {
              if (tab === activeTab) return
              setError(null)
              handleTabChange(tab)
            }}
          />

          {error ? (
            <ErrorState
              message={error}
              onRetry={() => (activeTab === 'overview' ? refetchDashboard() : refetchReport())}
            />
          ) : (
            renderContentByTab()
          )}
        </div>
      </div>

      {/* Create/Edit schedule modal */}
      <ScheduleFormModal
        isOpen={scheduleModalOpen}
        onClose={onCloseScheduleModal}
        scheduleForm={scheduleForm}
        setScheduleForm={setScheduleForm}
        editingSchedule={editingSchedule}
        departments={departments}
        recipients={recipients as ScheduledReportRecipientUser[]}
        recipientsLoading={recipientsLoading}
        onToggleRecipient={onToggleRecipient}
        onSubmit={submitSchedule}
        createLoading={createScheduleLoading}
        updateLoading={updateScheduleLoading}
      />

      {/* Delete schedule modal */}
      <ScheduleDeleteModal
        isOpen={deleteScheduleOpen}
        onClose={() => {
          setDeleteScheduleOpen(false)
          setDeleteScheduleTarget(null)
        }}
        targetName={deleteScheduleTarget?.name}
        loading={deleteScheduleLoading}
        onConfirm={onDeleteSchedule}
      />

      <ScheduleHistoryModal
        isOpen={scheduleHistoryOpen}
        schedule={scheduleHistorySchedule}
        onClose={() => {
          setScheduleHistoryOpen(false)
          setScheduleHistorySchedule(null)
        }}
      />
    </DashboardShell>
  )
}
