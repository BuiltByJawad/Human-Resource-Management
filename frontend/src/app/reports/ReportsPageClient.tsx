"use client"

import DashboardShell from '@/components/ui/DashboardShell'
import { ErrorState } from '@/components/features/reports/ReportStates'
import { ReportsHeader } from '@/components/features/reports/ReportsHeader'
import { ReportsTabs } from '@/components/features/reports/ReportsTabs'
import { ReportsScheduleModals } from '@/components/features/reports'
import {
  useReportsPage,
  type ReportsPageProps,
} from '@/hooks/useReportsPage'
import { useReportsTabContent } from '@/hooks/useReportsTabContent'
import type { ScheduledReport } from '@/services/reports/api'

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
    deleteScheduleLoading,
    deleteScheduleMutation,
  } = useReportsPage({ initialDashboardData, initialDepartments })

  const { content: tabContent } = useReportsTabContent({
    activeTab,
    isLoading,
    isSchedulesLoading,
    dashboardData,
    schedules: Array.isArray(schedules) ? schedules : [],
    employeesData,
    attendanceData,
    leaveData,
    payrollData,
    startDate,
    endDate,
    departmentId,
    departments,
    setStartDate,
    setEndDate,
    setDepartmentId,
    onExportCSV,
    onExportPDF,
    onCreateSchedule: openCreateSchedule,
    onToggleEnabled,
    onEditSchedule: openEditSchedule,
    onScheduleHistory: (schedule: ScheduledReport) => {
      setScheduleHistorySchedule(schedule)
      setScheduleHistoryOpen(true)
    },
    onRunNow,
    onDeleteSchedule: (schedule: ScheduledReport) => {
      setDeleteScheduleTarget(schedule)
      setDeleteScheduleOpen(true)
    },
    togglePendingId: toggleEnabledMutation.variables?.id,
    runNowPendingId: runNowMutation.variables as string | undefined,
    deletePendingId: deleteScheduleMutation.variables as string | undefined,
  })

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
            tabContent
          )}
        </div>
      </div>

      {/* Create/Edit schedule modal */}
      <ReportsScheduleModals
        scheduleModalOpen={scheduleModalOpen}
        onCloseScheduleModal={onCloseScheduleModal}
        scheduleForm={scheduleForm}
        setScheduleForm={setScheduleForm}
        editingSchedule={editingSchedule}
        departments={departments}
        recipients={recipients}
        recipientsLoading={recipientsLoading}
        onToggleRecipient={onToggleRecipient}
        onSubmitSchedule={submitSchedule}
        createLoading={createScheduleLoading}
        updateLoading={updateScheduleLoading}
        deleteScheduleOpen={deleteScheduleOpen}
        onCloseDeleteModal={() => {
          setDeleteScheduleOpen(false)
          setDeleteScheduleTarget(null)
        }}
        deleteScheduleTarget={deleteScheduleTarget}
        deleteScheduleLoading={deleteScheduleLoading}
        onDeleteSchedule={onDeleteSchedule}
        scheduleHistoryOpen={scheduleHistoryOpen}
        scheduleHistorySchedule={scheduleHistorySchedule}
        onCloseScheduleHistory={() => {
          setScheduleHistoryOpen(false)
          setScheduleHistorySchedule(null)
        }}
      />
    </DashboardShell>
  )
}
