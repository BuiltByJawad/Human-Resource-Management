"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { ArrowLeftIcon, ExclamationCircleIcon } from "@heroicons/react/24/outline"

import { DataTable, type Column } from "@/components/ui/DataTable"
import { ReportFilters, DashboardStats, SummaryCard, ExportButton, ExportPdfButton } from "@/components/reports/ReportsComponents"
import { Modal } from "@/components/ui/Modal"
import { Button, Input, Select } from "@/components/ui/FormComponents"
import { useAuthStore } from "@/store/useAuthStore"
import { useToast } from "@/components/ui/ToastProvider"
import {
  createScheduledReport,
  deleteScheduledReport,
  downloadReportCsv,
  downloadReportPdf,
  fetchDepartments,
  fetchReportByType,
  fetchReportsDashboard,
  fetchScheduledReportRecipients,
  fetchScheduledReports,
  runScheduledReportNow,
  setScheduledReportEnabled,
  updateScheduledReport,
  type ReportsFilterParams,
  type ScheduledReport,
  type ScheduledReportFormat,
  type ScheduledReportFrequency,
  type ScheduledReportRecipientUser,
  type ScheduledReportType,
  type UpsertScheduledReportPayload,
} from "@/lib/hrmData"
import { handleCrudError } from "@/lib/apiError"

type TabType = "overview" | "employees" | "attendance" | "leave" | "payroll" | "schedules"

type AttendanceResponse = {
  attendance: any[]
  summary?: {
    totalRecords: number
    presentDays: number
    absentDays: number
    lateDays: number
    totalWorkHours: number
    totalOvertimeHours: number
  }
}

type LeaveResponse = {
  leaveRequests: any[]
  summary?: {
    totalRequests: number
    approvedRequests: number
    pendingRequests: number
    rejectedRequests: number
    totalDaysRequested: number
  }
}

type PayrollResponse = {
  payrollRecords: any[]
  summary?: {
    totalRecords: number
    totalBaseSalary: number
    totalAllowances: number
    totalDeductions: number
    totalNetSalary: number
  }
}

interface ReportsPageClientProps {
  initialDashboardData: any | null
  initialDepartments: Array<{ value: string; label: string }>
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-6 animate-pulse">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="h-4 bg-gray-200 rounded w-24 mb-4" />
          <div className="h-8 bg-gray-300 rounded w-16" />
        </div>
      ))}
    </div>
  )
}

function TableSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden animate-pulse">
      <div className="p-4 border-b border-gray-200">
        <div className="h-10 bg-gray-200 rounded w-64" />
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {[1, 2, 3, 4, 5].map((i) => (
                <th key={i} className="px-6 py-3">
                  <div className="h-4 bg-gray-200 rounded w-20" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {[1, 2, 3, 4, 5].map((i) => (
              <tr key={i}>
                {[1, 2, 3, 4, 5].map((j) => (
                  <td key={j} className="px-6 py-4">
                    <div className="h-4 bg-gray-100 rounded w-24" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
        />
      </svg>
      <h3 className="mt-2 text-sm font-medium text-gray-900">No data available</h3>
      <p className="mt-1 text-sm text-gray-500">{message}</p>
    </div>
  )
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
      <ExclamationCircleIcon className="mx-auto h-12 w-12 text-red-400 mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to Load Data</h3>
      <p className="text-sm text-gray-500 mb-6">{message}</p>
      <button
        onClick={onRetry}
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        Try Again
      </button>
    </div>
  )
}

export function ReportsPageClient({ initialDashboardData, initialDepartments }: ReportsPageClientProps) {
  const router = useRouter()
  const { token } = useAuthStore()
  const { showToast } = useToast()
  const queryClient = useQueryClient()

  const [activeTab, setActiveTab] = useState<TabType>("overview")
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)
  const [departmentId, setDepartmentId] = useState("")
  const [departments, setDepartments] = useState(initialDepartments)
  const [error, setError] = useState<string | null>(null)

  const [scheduleModalOpen, setScheduleModalOpen] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState<ScheduledReport | null>(null)
  const [scheduleName, setScheduleName] = useState("")
  const [scheduleType, setScheduleType] = useState<ScheduledReportType>("employees")
  const [scheduleFormat, setScheduleFormat] = useState<ScheduledReportFormat>("csv")
  const [scheduleFrequency, setScheduleFrequency] = useState<ScheduledReportFrequency>("weekly")
  const [scheduleStartDate, setScheduleStartDate] = useState<string>("")
  const [scheduleEndDate, setScheduleEndDate] = useState<string>("")
  const [scheduleDepartmentId, setScheduleDepartmentId] = useState<string>("")
  const [scheduleRecipientUserIds, setScheduleRecipientUserIds] = useState<string[]>([])
  const [scheduleIsEnabled, setScheduleIsEnabled] = useState<boolean>(true)

  const [scheduleHistoryOpen, setScheduleHistoryOpen] = useState(false)
  const [scheduleHistorySchedule, setScheduleHistorySchedule] = useState<ScheduledReport | null>(null)

  const [deleteScheduleOpen, setDeleteScheduleOpen] = useState(false)
  const [deleteScheduleTarget, setDeleteScheduleTarget] = useState<ScheduledReport | null>(null)

  useEffect(() => {
    if (!token) return
    fetchDepartments(token)
      .then((data) => {
        const list = Array.isArray(data) ? data : []
        const options = list.map((dept) => ({
          value: dept.id,
          label: dept.name,
        }))
        setDepartments(options)
      })
      .catch((err: unknown) => {
        if (process.env.NODE_ENV !== 'production') {
          console.error("Error fetching departments:", err)
        }
      })
  }, [token])

  const filters = useMemo<ReportsFilterParams>(
    () => ({
      startDate: startDate ? startDate.toISOString() : undefined,
      endDate: endDate ? endDate.toISOString() : undefined,
      departmentId: departmentId || undefined,
    }),
    [startDate, endDate, departmentId],
  )

  const dashboardQuery = useQuery({
    queryKey: ["reports", "dashboard", token],
    queryFn: () => fetchReportsDashboard(token ?? undefined),
    enabled: activeTab === "overview" && !!token,
    initialData: initialDashboardData ?? undefined,
  })

  const reportQuery = useQuery({
    queryKey: ["reports", activeTab, filters, token],
    queryFn: () =>
      fetchReportByType(activeTab as Exclude<TabType, "overview" | "schedules">, filters, token ?? undefined),
    enabled: activeTab !== "overview" && activeTab !== "schedules" && !!token,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  })

  const schedulesQuery = useQuery({
    queryKey: ["reports", "schedules", token],
    queryFn: () => fetchScheduledReports(token ?? undefined),
    enabled: activeTab === "schedules" && !!token,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
  })

  const recipientsQuery = useQuery({
    queryKey: ["reports", "schedule-recipients", token],
    queryFn: () => fetchScheduledReportRecipients(token ?? undefined),
    enabled: scheduleModalOpen && !!token,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  })

  useEffect(() => {
    if (dashboardQuery.isError && dashboardQuery.error) {
      handleCrudError({
        error: dashboardQuery.error,
        resourceLabel: "Reports dashboard",
        showToast,
        onUnauthorized: () => setError("You do not have permission to view reports"),
      })
    } else if (!dashboardQuery.isError && activeTab === "overview") {
      setError(null)
    }
  }, [dashboardQuery.isError, dashboardQuery.error, showToast, activeTab])

  useEffect(() => {
    if (reportQuery.isError && reportQuery.error) {
      const err: any = reportQuery.error
      const message =
        err?.response?.status === 403
          ? "You do not have permission to view this report"
          : err?.response?.data?.message || `Failed to load ${activeTab} data`
      setError(message)
      handleCrudError({
        error: err,
        resourceLabel: "Report",
        showToast,
        onUnauthorized: () => setError("You do not have permission to view this report"),
      })
    } else if (!reportQuery.isError && activeTab !== "overview") {
      setError(null)
    }
  }, [reportQuery.isError, reportQuery.error, showToast, activeTab])

  const isLoading = activeTab === "overview" ? dashboardQuery.isLoading : reportQuery.isLoading

  const isSchedulesLoading = schedulesQuery.isLoading

  const employeesData =
    activeTab === "employees"
      ? (Array.isArray(reportQuery.data) ? reportQuery.data : (reportQuery.data as any)?.items ?? [])
      : []
  const attendanceData = activeTab === "attendance" ? ((reportQuery.data as AttendanceResponse) ?? null) : null
  const leaveData = activeTab === "leave" ? ((reportQuery.data as LeaveResponse) ?? null) : null
  const payrollData = activeTab === "payroll" ? ((reportQuery.data as PayrollResponse) ?? null) : null

  const handleExportPDF = async () => {
    try {
      if (activeTab === "overview" || activeTab === "schedules") return
      await downloadReportPdf(activeTab as Exclude<TabType, "overview" | "schedules">, filters, token ?? undefined)
    } catch (err) {
      handleCrudError({ error: err, resourceLabel: "Export", showToast })
    }
  }

  const handleExportCSV = async () => {
    try {
      if (activeTab === "overview" || activeTab === "schedules") return
      await downloadReportCsv(activeTab as Exclude<TabType, "overview" | "schedules">, filters, token ?? undefined)
    } catch (err) {
      handleCrudError({ error: err, resourceLabel: "Export", showToast })
    }
  }

  const createScheduleMutation = useMutation({
    mutationFn: (payload: UpsertScheduledReportPayload) => createScheduledReport(payload, token ?? undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports", "schedules", token] })
      showToast("Scheduled report created", "success")
      setScheduleModalOpen(false)
    },
    onError: (err) => handleCrudError({ error: err, resourceLabel: "Schedule", showToast }),
  })

  const updateScheduleMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpsertScheduledReportPayload }) =>
      updateScheduledReport(id, payload, token ?? undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports", "schedules", token] })
      showToast("Scheduled report updated", "success")
      setScheduleModalOpen(false)
    },
    onError: (err) => handleCrudError({ error: err, resourceLabel: "Schedule", showToast }),
  })

  const runNowMutation = useMutation({
    mutationFn: (id: string) => runScheduledReportNow(id, token ?? undefined),
    onSuccess: (data) => {
      showToast(`Report delivered to ${data.deliveredCount} recipient(s)`, "success")
      queryClient.invalidateQueries({ queryKey: ["reports", "schedules", token] })
    },
    onError: (err) => handleCrudError({ error: err, resourceLabel: "Run schedule", showToast }),
  })

  const toggleEnabledMutation = useMutation({
    mutationFn: ({ id, isEnabled }: { id: string; isEnabled: boolean }) =>
      setScheduledReportEnabled(id, isEnabled, token ?? undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports", "schedules", token] })
    },
    onError: (err) => handleCrudError({ error: err, resourceLabel: "Update schedule", showToast }),
  })

  const deleteScheduleMutation = useMutation({
    mutationFn: (id: string) => deleteScheduledReport(id, token ?? undefined),
    onSuccess: () => {
      showToast("Scheduled report deleted", "success")
      queryClient.invalidateQueries({ queryKey: ["reports", "schedules", token] })
    },
    onError: (err) => handleCrudError({ error: err, resourceLabel: "Delete schedule", showToast }),
  })

  const openCreateSchedule = () => {
    setEditingSchedule(null)
    setScheduleName("")
    setScheduleType("employees")
    setScheduleFormat("csv")
    setScheduleFrequency("weekly")
    setScheduleStartDate("")
    setScheduleEndDate("")
    setScheduleDepartmentId("")
    setScheduleRecipientUserIds([])
    setScheduleIsEnabled(true)
    setScheduleModalOpen(true)
  }

  const openEditSchedule = (s: ScheduledReport) => {
    setEditingSchedule(s)
    setScheduleName(s.name ?? "")
    setScheduleType(s.type)
    setScheduleFormat(s.format)
    setScheduleFrequency(s.frequency)
    setScheduleStartDate(s.filters?.startDate ? String(s.filters.startDate).slice(0, 10) : "")
    setScheduleEndDate(s.filters?.endDate ? String(s.filters.endDate).slice(0, 10) : "")
    setScheduleDepartmentId(s.filters?.departmentId ? String(s.filters.departmentId) : "")
    setScheduleRecipientUserIds(Array.isArray(s.recipients) ? s.recipients.map((r) => r.userId) : [])
    setScheduleIsEnabled(Boolean(s.isEnabled))
    setScheduleModalOpen(true)
  }

  const submitSchedule = async () => {
    const payload: UpsertScheduledReportPayload = {
      name: scheduleName.trim(),
      type: scheduleType,
      format: scheduleFormat,
      frequency: scheduleFrequency,
      recipientUserIds: scheduleRecipientUserIds,
      isEnabled: scheduleIsEnabled,
      filters: {
        startDate: scheduleStartDate ? new Date(scheduleStartDate).toISOString() : undefined,
        endDate: scheduleEndDate ? new Date(scheduleEndDate).toISOString() : undefined,
        departmentId: scheduleDepartmentId || undefined,
      },
    }

    if (!payload.name) {
      showToast("Schedule name is required", "error")
      return
    }

    if (!payload.recipientUserIds.length) {
      showToast("Select at least one recipient", "error")
      return
    }

    if (editingSchedule?.id) {
      await updateScheduleMutation.mutateAsync({ id: editingSchedule.id, payload })
    } else {
      await createScheduleMutation.mutateAsync(payload)
    }
  }

  const tabs = [
    { id: "overview" as TabType, name: "Overview", description: "Dashboard metrics" },
    { id: "employees" as TabType, name: "Employees", description: "Employee directory" },
    { id: "attendance" as TabType, name: "Attendance", description: "Clock records" },
    { id: "leave" as TabType, name: "Leave", description: "Leave requests" },
    { id: "payroll" as TabType, name: "Payroll", description: "Salary records" },
    { id: "schedules" as TabType, name: "Schedules", description: "Scheduled exports" },
  ]

  const formatCurrency = (value?: number) => (value || value === 0 ? `$${Number(value).toLocaleString()}` : "N/A")

  const employeeColumns: Column<any>[] = [
    { key: "employeeNumber", header: "Employee #" },
    { key: "name", header: "Name", render: (_, item) => `${item.firstName ?? ""} ${item.lastName ?? ""}` },
    { key: "email", header: "Email" },
    { key: "department", header: "Department", render: (_, item) => item.department?.name || "N/A" },
    { key: "hireDate", header: "Hire Date", render: (value) => (value ? format(new Date(value), "MMM dd, yyyy") : "N/A") },
    { key: "salary", header: "Salary", render: (value) => formatCurrency(value) },
    {
      key: "status",
      header: "Status",
      render: (value) => (
        <span
          className={`px-2 py-1 text-xs font-medium rounded-full ${
            value === "Active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
          }`}
        >
          {value}
        </span>
      ),
    },
  ]

  const attendanceColumns: Column<any>[] = [
    { key: "employee", header: "Employee", render: (_, item) => `${item.employee?.firstName ?? ""} ${item.employee?.lastName ?? ""}` },
    { key: "checkIn", header: "Check In", render: (value) => (value ? format(new Date(value), "MMM dd, yyyy HH:mm") : "N/A") },
    { key: "checkOut", header: "Check Out", render: (value) => (value ? format(new Date(value), "HH:mm") : "N/A") },
    { key: "workHours", header: "Work Hours", render: (value) => (value ? `${Number(value).toFixed(2)}h` : "N/A") },
    {
      key: "status",
      header: "Status",
      render: (value) => (
        <span
          className={`px-2 py-1 text-xs font-medium rounded-full ${
            value === "Present" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          }`}
        >
          {value}
        </span>
      ),
    },
  ]

  const leaveColumns: Column<any>[] = [
    { key: "employee", header: "Employee", render: (_, item) => `${item.employee?.firstName ?? ""} ${item.employee?.lastName ?? ""}` },
    { key: "leaveType", header: "Type" },
    { key: "startDate", header: "Start Date", render: (value) => (value ? format(new Date(value), "MMM dd, yyyy") : "N/A") },
    { key: "daysRequested", header: "Days" },
    {
      key: "status",
      header: "Status",
      render: (value) => (
        <span
          className={`px-2 py-1 text-xs font-medium rounded-full ${
            value === "Approved"
              ? "bg-green-100 text-green-800"
              : value === "Pending"
                ? "bg-yellow-100 text-yellow-800"
                : "bg-red-100 text-red-800"
          }`}
        >
          {value}
        </span>
      ),
    },
  ]

  const payrollColumns: Column<any>[] = [
    { key: "employee", header: "Employee", render: (_, item) => `${item.employee?.firstName ?? ""} ${item.employee?.lastName ?? ""}` },
    { key: "baseSalary", header: "Base Salary", render: (value) => formatCurrency(value) },
    { key: "allowances", header: "Allowances", render: (value) => formatCurrency(value) },
    { key: "deductions", header: "Deductions", render: (value) => formatCurrency(value) },
    { key: "netSalary", header: "Net Salary", render: (value) => formatCurrency(value) },
  ]

  const scheduleColumns: Column<ScheduledReport>[] = [
    { key: "name", header: "Name" },
    { key: "type", header: "Type" },
    { key: "format", header: "Format" },
    { key: "frequency", header: "Frequency" },
    {
      key: "lastRun",
      header: "Last Run",
      render: (_, item) => {
        const run = Array.isArray(item.runs) && item.runs.length ? item.runs[0] : null
        if (!run) return "—"

        const statusClass =
          run.status === "success"
            ? "bg-green-100 text-green-800"
            : run.status === "failed"
              ? "bg-red-100 text-red-800"
              : run.status === "running"
                ? "bg-blue-100 text-blue-800"
                : "bg-gray-100 text-gray-800"

        return (
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusClass}`}>{run.status}</span>
            <span className="text-xs text-gray-600">{run.deliveredCount} delivered</span>
          </div>
        )
      },
    },
    {
      key: "isEnabled",
      header: "Enabled",
      render: (value) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${value ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
          {value ? "Yes" : "No"}
        </span>
      ),
    },
    {
      key: "nextRunAt",
      header: "Next Run",
      render: (value) => (value ? format(new Date(String(value)), "MMM dd, yyyy HH:mm") : "—"),
    },
    {
      key: "actions",
      header: "Actions",
      render: (_, item) => (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            loading={
              toggleEnabledMutation.isPending &&
              toggleEnabledMutation.variables?.id === item.id &&
              toggleEnabledMutation.variables?.isEnabled === !item.isEnabled
            }
            onClick={() => toggleEnabledMutation.mutate({ id: item.id, isEnabled: !item.isEnabled })}
          >
            {item.isEnabled ? "Disable" : "Enable"}
          </Button>
          <Button size="sm" variant="outline" onClick={() => openEditSchedule(item)}>
            Edit
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setScheduleHistorySchedule(item)
              setScheduleHistoryOpen(true)
            }}
          >
            History
          </Button>
          <Button
            size="sm"
            variant="primary"
            loading={runNowMutation.isPending && runNowMutation.variables === item.id}
            onClick={() => runNowMutation.mutate(item.id)}
          >
            Run now
          </Button>
          <Button
            size="sm"
            variant="danger"
            loading={deleteScheduleMutation.isPending && deleteScheduleMutation.variables === item.id}
            onClick={() => {
              setDeleteScheduleTarget(item)
              setDeleteScheduleOpen(true)
            }}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-start space-x-4">
            <button
              onClick={() => router.back()}
              className="mt-1 p-2 rounded-full hover:bg-gray-200 transition-colors text-gray-500 hover:text-gray-900"
            >
              <ArrowLeftIcon className="h-6 w-6" />
            </button>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent tracking-tight">
                Reports &amp; Analytics
              </h1>
              <p className="mt-2 text-sm text-gray-600 font-medium">Comprehensive insights and data exports for your organization</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6 overflow-hidden">
          <nav className="flex overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                disabled={activeTab === tab.id}
                onClick={() => {
                  if (activeTab === tab.id) return
                  setError(null)
                  setActiveTab(tab.id)
                }}
                className={`flex-1 min-w-fit px-6 py-4 text-sm font-medium transition-all duration-200 border-b-2 ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600 bg-blue-50"
                    : "border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                <div className="flex flex-col items-center space-y-1">
                  <span>{tab.name}</span>
                  <span className="text-xs text-gray-500 font-normal">{tab.description}</span>
                </div>
              </button>
            ))}
          </nav>
        </div>

        {error ? (
          <ErrorState message={error} onRetry={() => (activeTab === "overview" ? dashboardQuery.refetch() : reportQuery.refetch())} />
        ) : (
          <>
            {activeTab === "overview" && (
              <>
                {dashboardQuery.isLoading ? (
                  <LoadingSkeleton />
                ) : dashboardQuery.data ? (
                  <DashboardStats
                    totalEmployees={dashboardQuery.data?.metrics?.totalEmployees ?? 0}
                    presentToday={dashboardQuery.data?.metrics?.presentToday ?? 0}
                    pendingLeaves={dashboardQuery.data?.metrics?.pendingLeaves ?? 0}
                    monthlyPayroll={dashboardQuery.data?.metrics?.monthlyPayroll ?? 0}
                  />
                ) : null}
              </>
            )}

            {activeTab !== "overview" && (
              <ReportFilters
                startDate={startDate}
                endDate={endDate}
                departmentId={departmentId}
                onStartDateChange={setStartDate}
                onEndDateChange={setEndDate}
                onDepartmentChange={setDepartmentId}
                departments={departments}
              />
            )}

            {activeTab === "schedules" && (
              <div>
                <div className="flex items-center justify-end mb-4">
                  <Button onClick={openCreateSchedule}>Create schedule</Button>
                </div>

                {isSchedulesLoading ? (
                  <TableSkeleton />
                ) : !Array.isArray(schedulesQuery.data) || schedulesQuery.data.length === 0 ? (
                  <EmptyState message="No schedules yet. Create one to automatically email reports." />
                ) : (
                  <DataTable data={schedulesQuery.data} columns={scheduleColumns} loading={false} />
                )}

                <Modal
                  isOpen={scheduleModalOpen}
                  onClose={() => setScheduleModalOpen(false)}
                  title={editingSchedule ? "Edit scheduled report" : "Create scheduled report"}
                  size="lg"
                >
                  <div className="space-y-4">
                    <Input label="Name" value={scheduleName} onChange={(e) => setScheduleName(e.target.value)} required />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Select
                        label="Type"
                        value={scheduleType}
                        onChange={(v) => setScheduleType(v as ScheduledReportType)}
                        options={[
                          { value: "employees", label: "Employees" },
                          { value: "attendance", label: "Attendance" },
                          { value: "leave", label: "Leave" },
                          { value: "payroll", label: "Payroll" },
                        ]}
                      />

                      <Select
                        label="Format"
                        value={scheduleFormat}
                        onChange={(v) => setScheduleFormat(v as ScheduledReportFormat)}
                        options={[
                          { value: "csv", label: "CSV" },
                          { value: "pdf", label: "PDF" },
                        ]}
                      />

                      <Select
                        label="Frequency"
                        value={scheduleFrequency}
                        onChange={(v) => setScheduleFrequency(v as ScheduledReportFrequency)}
                        options={[
                          { value: "daily", label: "Daily" },
                          { value: "weekly", label: "Weekly" },
                          { value: "monthly", label: "Monthly" },
                        ]}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Input
                        label="Start Date (optional)"
                        type="date"
                        value={scheduleStartDate}
                        onChange={(e) => setScheduleStartDate(e.target.value)}
                      />
                      <Input
                        label="End Date (optional)"
                        type="date"
                        value={scheduleEndDate}
                        onChange={(e) => setScheduleEndDate(e.target.value)}
                      />
                      <Select
                        label="Department (optional)"
                        value={scheduleDepartmentId}
                        onChange={setScheduleDepartmentId}
                        options={[{ value: "", label: "All Departments" }, ...departments]}
                      />
                    </div>

                    <div className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm font-medium text-gray-900">Recipients</div>
                        <div className="text-xs text-gray-500">{scheduleRecipientUserIds.length} selected</div>
                      </div>

                      {recipientsQuery.isLoading ? (
                        <div className="text-sm text-gray-600">Loading recipients...</div>
                      ) : (
                        <div className="max-h-56 overflow-y-auto space-y-2">
                          {(Array.isArray(recipientsQuery.data) ? recipientsQuery.data : []).map((u: ScheduledReportRecipientUser) => {
                            const checked = scheduleRecipientUserIds.includes(u.id)
                            return (
                              <label key={u.id} className="flex items-center gap-2 text-sm text-gray-800">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => {
                                    setScheduleRecipientUserIds((prev) =>
                                      prev.includes(u.id) ? prev.filter((id) => id !== u.id) : [...prev, u.id]
                                    )
                                  }}
                                />
                                <span className="truncate">{`${u.firstName} ${u.lastName}`.trim() || u.email}</span>
                                <span className="text-xs text-gray-500 truncate">{u.email}</span>
                              </label>
                            )
                          })}
                        </div>
                      )}
                    </div>

                    <label className="flex items-center gap-2 text-sm text-gray-800">
                      <input type="checkbox" checked={scheduleIsEnabled} onChange={(e) => setScheduleIsEnabled(e.target.checked)} />
                      Enabled
                    </label>

                    <div className="flex justify-end gap-2 pt-2">
                      <Button variant="secondary" onClick={() => setScheduleModalOpen(false)}>
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        loading={createScheduleMutation.isPending || updateScheduleMutation.isPending}
                        onClick={submitSchedule}
                      >
                        {editingSchedule ? "Save" : "Create"}
                      </Button>
                    </div>
                  </div>
                </Modal>

      <Modal
        isOpen={deleteScheduleOpen}
        onClose={() => {
          setDeleteScheduleOpen(false)
          setDeleteScheduleTarget(null)
        }}
        title="Delete scheduled report"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-700">
            Are you sure you want to delete <span className="font-medium">{deleteScheduleTarget?.name}</span>? This
            cannot be undone.
          </p>

          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteScheduleOpen(false)
                setDeleteScheduleTarget(null)
              }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={deleteScheduleMutation.isPending}
              onClick={() => {
                if (!deleteScheduleTarget) return
                deleteScheduleMutation.mutate(deleteScheduleTarget.id, {
                  onSuccess: () => {
                    setDeleteScheduleOpen(false)
                    setDeleteScheduleTarget(null)
                  },
                })
              }}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={scheduleHistoryOpen}
        onClose={() => {
          setScheduleHistoryOpen(false)
          setScheduleHistorySchedule(null)
        }}
        title={scheduleHistorySchedule ? `Run history - ${scheduleHistorySchedule.name}` : 'Run history'}
        size="lg"
      >
        <div className="space-y-3">
          {Array.isArray(scheduleHistorySchedule?.runs) && scheduleHistorySchedule?.runs.length ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delivered</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Started</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Finished</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Error</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {scheduleHistorySchedule.runs.map((r) => (
                    <tr key={r.id}>
                      <td className="px-4 py-2 text-sm text-gray-900">{r.status}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">{r.deliveredCount}</td>
                      <td className="px-4 py-2 text-sm text-gray-700">
                        {r.startedAt ? format(new Date(String(r.startedAt)), "MMM dd, yyyy HH:mm") : "—"}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700">
                        {r.finishedAt ? format(new Date(String(r.finishedAt)), "MMM dd, yyyy HH:mm") : "—"}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700">{r.errorMessage || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-sm text-gray-600">No runs recorded yet.</div>
          )}

          <div className="flex justify-end">
            <Button variant="secondary" onClick={() => setScheduleHistoryOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>

              </div>
            )}

            {activeTab === "employees" && (
              <div>
                {!isLoading && employeesData.length > 0 && (
                  <div className="flex justify-end mb-4">
                    <div className="flex items-center gap-3">
                      <ExportButton onClick={handleExportCSV} />
                      <ExportPdfButton onClick={handleExportPDF} />
                    </div>
                  </div>
                )}
                {isLoading ? (
                  <TableSkeleton />
                ) : employeesData.length === 0 ? (
                  <EmptyState message="No employees found. Try adjusting your filters." />
                ) : (
                  <DataTable
                    data={employeesData}
                    columns={employeeColumns}
                    loading={false}
                    searchKeys={["firstName", "lastName", "email", "employeeNumber", "department.name"]}
                  />
                )}
              </div>
            )}

            {activeTab === "attendance" && (
              <div>
                {!isLoading && !!attendanceData?.attendance?.length && (
                  <div className="flex justify-end mb-4">
                    <div className="flex items-center gap-3">
                      <ExportButton onClick={handleExportCSV} />
                      <ExportPdfButton onClick={handleExportPDF} />
                    </div>
                  </div>
                )}
                {isLoading ? (
                  <TableSkeleton />
                ) : !attendanceData || attendanceData.attendance?.length === 0 ? (
                  <EmptyState message="No attendance records found. Try adjusting your filters." />
                ) : (
                  <>
                    {attendanceData.summary && (
                      <div className="mb-6">
                        <SummaryCard
                          title="Attendance Summary"
                          data={{
                            "Total Records": attendanceData.summary.totalRecords,
                            "Present Days": attendanceData.summary.presentDays,
                            "Absent Days": attendanceData.summary.absentDays,
                            "Late Days": attendanceData.summary.lateDays,
                            "Total Work Hours": `${attendanceData.summary.totalWorkHours?.toFixed?.(2) ?? 0}h`,
                            "Total Overtime": `${attendanceData.summary.totalOvertimeHours?.toFixed?.(2) ?? 0}h`,
                          }}
                        />
                      </div>
                    )}
                    <DataTable data={attendanceData.attendance} columns={attendanceColumns} loading={false} />
                  </>
                )}
              </div>
            )}

            {activeTab === "leave" && (
              <div>
                {!isLoading && !!leaveData?.leaveRequests?.length && (
                  <div className="flex justify-end mb-4">
                    <div className="flex items-center gap-3">
                      <ExportButton onClick={handleExportCSV} />
                      <ExportPdfButton onClick={handleExportPDF} />
                    </div>
                  </div>
                )}
                {isLoading ? (
                  <TableSkeleton />
                ) : !leaveData || leaveData.leaveRequests?.length === 0 ? (
                  <EmptyState message="No leave requests found. Try adjusting your filters." />
                ) : (
                  <>
                    {leaveData.summary && (
                      <div className="mb-6">
                        <SummaryCard
                          title="Leave Summary"
                          data={{
                            "Total Requests": leaveData.summary.totalRequests,
                            Approved: leaveData.summary.approvedRequests,
                            Pending: leaveData.summary.pendingRequests,
                            Rejected: leaveData.summary.rejectedRequests,
                            "Total Days Requested": leaveData.summary.totalDaysRequested,
                          }}
                        />
                      </div>
                    )}
                    <DataTable data={leaveData.leaveRequests} columns={leaveColumns} loading={false} />
                  </>
                )}
              </div>
            )}

            {activeTab === "payroll" && (
              <div>
                {!isLoading && !!payrollData?.payrollRecords?.length && (
                  <div className="flex justify-end mb-4">
                    <div className="flex items-center gap-3">
                      <ExportButton onClick={handleExportCSV} />
                      <ExportPdfButton onClick={handleExportPDF} />
                    </div>
                  </div>
                )}
                {isLoading ? (
                  <TableSkeleton />
                ) : !payrollData || payrollData.payrollRecords?.length === 0 ? (
                  <EmptyState message="No payroll records found. Try adjusting your filters." />
                ) : (
                  <>
                    {payrollData.summary && (
                      <div className="mb-6">
                        <SummaryCard
                          title="Payroll Summary"
                          data={{
                            "Total Records": payrollData.summary.totalRecords,
                            "Total Base Salary": formatCurrency(payrollData.summary.totalBaseSalary),
                            "Total Allowances": formatCurrency(payrollData.summary.totalAllowances),
                            "Total Deductions": formatCurrency(payrollData.summary.totalDeductions),
                            "Total Net Salary": formatCurrency(payrollData.summary.totalNetSalary),
                          }}
                        />
                      </div>
                    )}
                    <DataTable data={payrollData.payrollRecords} columns={payrollColumns} loading={false} />
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
