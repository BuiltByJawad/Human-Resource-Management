'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import { useAuthStore } from '@/store/useAuthStore'
import { useToast } from '@/components/ui/ToastProvider'
import {
  getReportsDashboard,
  getReportByType,
  downloadReportCsvApi,
  downloadReportPdfApi,
  getScheduledReportRecipients,
  getScheduledReports,
  createScheduledReportApi,
  updateScheduledReportApi,
  runScheduledReportNowApi,
  setScheduledReportEnabledApi,
  deleteScheduledReportApi,
  type ReportsFilterParams,
  type ScheduledReport,
  type ScheduledReportRecipientUser,
  type ScheduledReportType,
  type ScheduledReportFormat,
  type ScheduledReportFrequency,
} from '@/services/reports/api'

export type TabType = 'overview' | 'employees' | 'attendance' | 'leave' | 'payroll' | 'schedules'

export interface ReportsPageProps {
  initialDashboardData: any | null
  initialDepartments: Array<{ value: string; label: string }>
}

export interface ScheduleFormState {
  name: string
  type: ScheduledReportType
  format: ScheduledReportFormat
  frequency: ScheduledReportFrequency
  startDate: string
  endDate: string
  departmentId: string
  recipientUserIds: string[]
  isEnabled: boolean
}

const DEFAULT_FORM: ScheduleFormState = {
  name: '',
  type: 'employees',
  format: 'csv',
  frequency: 'weekly',
  startDate: '',
  endDate: '',
  departmentId: '',
  recipientUserIds: [],
  isEnabled: true,
}

export function useReportsPage({ initialDashboardData, initialDepartments }: ReportsPageProps) {
  const { token } = useAuthStore()
  const { showToast } = useToast()
  const queryClient = useQueryClient()

  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)
  const [departmentId, setDepartmentId] = useState('')
  const [departments, setDepartments] = useState(initialDepartments)
  const [error, setError] = useState<string | null>(null)

  const [scheduleModalOpen, setScheduleModalOpen] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState<ScheduledReport | null>(null)
  const [scheduleForm, setScheduleForm] = useState<ScheduleFormState>(DEFAULT_FORM)
  const [scheduleHistoryOpen, setScheduleHistoryOpen] = useState(false)
  const [scheduleHistorySchedule, setScheduleHistorySchedule] = useState<ScheduledReport | null>(null)
  const [deleteScheduleOpen, setDeleteScheduleOpen] = useState(false)
  const [deleteScheduleTarget, setDeleteScheduleTarget] = useState<ScheduledReport | null>(null)

  const filters = useMemo<ReportsFilterParams>(
    () => ({
      startDate: startDate ? startDate.toISOString() : undefined,
      endDate: endDate ? endDate.toISOString() : undefined,
      departmentId: departmentId || undefined,
    }),
    [startDate, endDate, departmentId],
  )

  const dashboardQuery = useQuery({
    queryKey: ['reports', 'dashboard', token],
    queryFn: () => getReportsDashboard(token ?? undefined),
    enabled: activeTab === 'overview' && !!token,
    initialData: initialDashboardData ?? undefined,
  })

  const reportQuery = useQuery({
    queryKey: ['reports', activeTab, filters, token],
    queryFn: () => getReportByType(activeTab as Exclude<TabType, 'overview' | 'schedules'>, filters, token ?? undefined),
    enabled: activeTab !== 'overview' && activeTab !== 'schedules' && !!token,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  })

  const schedulesQuery = useQuery({
    queryKey: ['reports', 'schedules', token],
    queryFn: () => getScheduledReports(token ?? undefined),
    enabled: activeTab === 'schedules' && !!token,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
  })

  const recipientsQuery = useQuery({
    queryKey: ['reports', 'schedule-recipients', token],
    queryFn: () => getScheduledReportRecipients(token ?? undefined),
    enabled: scheduleModalOpen && !!token,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  })

  useEffect(() => {
    if (!token) return
    // refresh departments list
    // reuse initialDepartments if already present
    setDepartments(initialDepartments)
  }, [initialDepartments, token])

  useEffect(() => {
    if (dashboardQuery.isError && dashboardQuery.error) {
      setError('Failed to load reports dashboard')
    } else if (!dashboardQuery.isError && activeTab === 'overview') {
      setError(null)
    }
  }, [dashboardQuery.isError, dashboardQuery.error, activeTab])

  useEffect(() => {
    if (reportQuery.isError && reportQuery.error) {
      const err: any = reportQuery.error
      const message =
        err?.response?.status === 403
          ? 'You do not have permission to view this report'
          : err?.response?.data?.message || `Failed to load ${activeTab} data`
      setError(message)
    } else if (!reportQuery.isError && activeTab !== 'overview') {
      setError(null)
    }
  }, [reportQuery.isError, reportQuery.error, activeTab])

  const createScheduleMutation = useMutation({
    mutationFn: (payload: ScheduleFormState) =>
      createScheduledReportApi(
        {
          name: payload.name.trim(),
          type: payload.type,
          format: payload.format,
          frequency: payload.frequency,
          recipientUserIds: payload.recipientUserIds,
          isEnabled: payload.isEnabled,
          filters: {
            startDate: payload.startDate ? new Date(payload.startDate).toISOString() : undefined,
            endDate: payload.endDate ? new Date(payload.endDate).toISOString() : undefined,
            departmentId: payload.departmentId || undefined,
          },
        },
        token ?? undefined,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports', 'schedules', token] })
      showToast('Scheduled report created', 'success')
      setScheduleModalOpen(false)
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : 'Failed to create schedule'
      showToast(message, 'error')
    },
  })

  const updateScheduleMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ScheduleFormState }) =>
      updateScheduledReportApi(
        id,
        {
          name: payload.name.trim(),
          type: payload.type,
          format: payload.format,
          frequency: payload.frequency,
          recipientUserIds: payload.recipientUserIds,
          isEnabled: payload.isEnabled,
          filters: {
            startDate: payload.startDate ? new Date(payload.startDate).toISOString() : undefined,
            endDate: payload.endDate ? new Date(payload.endDate).toISOString() : undefined,
            departmentId: payload.departmentId || undefined,
          },
        },
        token ?? undefined,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports', 'schedules', token] })
      showToast('Scheduled report updated', 'success')
      setScheduleModalOpen(false)
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : 'Failed to update schedule'
      showToast(message, 'error')
    },
  })

  const runNowMutation = useMutation({
    mutationFn: (id: string) => runScheduledReportNowApi(id, token ?? undefined),
    onSuccess: (data) => {
      showToast(`Report delivered to ${data.deliveredCount} recipient(s)`, 'success')
      queryClient.invalidateQueries({ queryKey: ['reports', 'schedules', token] })
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : 'Failed to run schedule'
      showToast(message, 'error')
    },
  })

  const toggleEnabledMutation = useMutation({
    mutationFn: ({ id, isEnabled }: { id: string; isEnabled: boolean }) =>
      setScheduledReportEnabledApi(id, isEnabled, token ?? undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports', 'schedules', token] })
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : 'Failed to update schedule'
      showToast(message, 'error')
    },
  })

  const deleteScheduleMutation = useMutation({
    mutationFn: (id: string) => deleteScheduledReportApi(id, token ?? undefined),
    onSuccess: () => {
      showToast('Scheduled report deleted', 'success')
      queryClient.invalidateQueries({ queryKey: ['reports', 'schedules', token] })
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : 'Failed to delete schedule'
      showToast(message, 'error')
    },
  })

  const handleTabChange = useCallback((tab: TabType) => {
    setError(null)
    setActiveTab(tab)
  }, [])

  const handleExportCSV = useCallback(async () => {
    if (activeTab === 'overview' || activeTab === 'schedules') return
    await downloadReportCsvApi(activeTab as Exclude<TabType, 'overview' | 'schedules'>, filters, token ?? undefined)
  }, [activeTab, filters, token])

  const handleExportPDF = useCallback(async () => {
    if (activeTab === 'overview' || activeTab === 'schedules') return
    await downloadReportPdfApi(activeTab as Exclude<TabType, 'overview' | 'schedules'>, filters, token ?? undefined)
  }, [activeTab, filters, token])

  const openCreateSchedule = useCallback(() => {
    setEditingSchedule(null)
    setScheduleForm(DEFAULT_FORM)
    setScheduleModalOpen(true)
  }, [])

  const openEditSchedule = useCallback((s: ScheduledReport) => {
    setEditingSchedule(s)
    setScheduleForm({
      name: s.name ?? '',
      type: s.type,
      format: s.format,
      frequency: s.frequency,
      startDate: s.filters?.startDate ? String(s.filters.startDate).slice(0, 10) : '',
      endDate: s.filters?.endDate ? String(s.filters.endDate).slice(0, 10) : '',
      departmentId: s.filters?.departmentId ? String(s.filters.departmentId) : '',
      recipientUserIds: Array.isArray(s.recipients) ? s.recipients.map((r) => r.userId) : [],
      isEnabled: Boolean(s.isEnabled),
    })
    setScheduleModalOpen(true)
  }, [])

  const submitSchedule = useCallback(async () => {
    if (!scheduleForm.name.trim()) {
      showToast('Schedule name is required', 'error')
      return
    }

    if (!scheduleForm.recipientUserIds.length) {
      showToast('Select at least one recipient', 'error')
      return
    }

    if (editingSchedule?.id) {
      await updateScheduleMutation.mutateAsync({ id: editingSchedule.id, payload: scheduleForm })
    } else {
      await createScheduleMutation.mutateAsync(scheduleForm)
    }
  }, [editingSchedule, scheduleForm, createScheduleMutation, updateScheduleMutation, showToast])

  const onToggleRecipient = useCallback((userId: string) => {
    setScheduleForm((prev) => ({
      ...prev,
      recipientUserIds: prev.recipientUserIds.includes(userId)
        ? prev.recipientUserIds.filter((id) => id !== userId)
        : [...prev.recipientUserIds, userId],
    }))
  }, [])

  const onToggleEnabled = useCallback(
    (id: string, next: boolean) => toggleEnabledMutation.mutate({ id, isEnabled: next }),
    [toggleEnabledMutation],
  )

  const onRunNow = useCallback((id: string) => runNowMutation.mutate(id), [runNowMutation])

  const onDeleteSchedule = useCallback(() => {
    if (!deleteScheduleTarget) return
    deleteScheduleMutation.mutate(deleteScheduleTarget.id, {
      onSuccess: () => {
        setDeleteScheduleOpen(false)
        setDeleteScheduleTarget(null)
      },
    })
  }, [deleteScheduleMutation, deleteScheduleTarget])

  const onCloseScheduleModal = useCallback(() => {
    setScheduleModalOpen(false)
    setEditingSchedule(null)
  }, [])

  const employeesData = activeTab === 'employees'
    ? (Array.isArray(reportQuery.data) ? reportQuery.data : (reportQuery.data as any)?.items ?? [])
    : []

  const attendanceData = activeTab === 'attendance' ? ((reportQuery.data as any) ?? null) : null
  const leaveData = activeTab === 'leave' ? ((reportQuery.data as any) ?? null) : null
  const payrollData = activeTab === 'payroll' ? ((reportQuery.data as any) ?? null) : null

  const isLoading = activeTab === 'overview' ? dashboardQuery.isLoading : reportQuery.isLoading
  const isSchedulesLoading = schedulesQuery.isLoading

  return {
    activeTab,
    handleTabChange,
    startDate,
    endDate,
    departmentId,
    departments,
    setStartDate,
    setEndDate,
    setDepartmentId,
    dashboardData: dashboardQuery.data,
    isLoading,
    isSchedulesLoading,
    employeesData,
    attendanceData,
    leaveData,
    payrollData,
    schedules: schedulesQuery.data ?? [],
    recipients: recipientsQuery.data ?? [],
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
    handleExportCSV,
    handleExportPDF,
    error,
    setError,
    runNowMutation,
    toggleEnabledMutation,
    createScheduleLoading: createScheduleMutation.isPending,
    updateScheduleLoading: updateScheduleMutation.isPending,
    recipientsLoading: recipientsQuery.isLoading,
    onToggleScheduleEnabled: onToggleEnabled,
    onRunSchedule: onRunNow,
    onSubmitSchedule: submitSchedule,
    onExportCSV: handleExportCSV,
    onExportPDF: handleExportPDF,
    refetchDashboard: dashboardQuery.refetch,
    refetchReport: reportQuery.refetch,
    refetchSchedules: schedulesQuery.refetch,
    deleteScheduleLoading: deleteScheduleMutation.isPending,
    deleteScheduleMutation,
  }
}
