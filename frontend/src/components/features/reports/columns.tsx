"use client"

import { format } from 'date-fns'

import type { Column } from '@/components/ui/DataTable'
import type { ScheduledReport } from '@/services/reports/api'

interface EmployeeRow {
  id: string
  employeeNumber?: string
  firstName?: string
  lastName?: string
  email?: string
  department?: { name?: string }
  hireDate?: string
  salary?: number
  status?: string
}

interface AttendanceRow {
  id: string
  employee?: { firstName?: string; lastName?: string }
  checkIn?: string
  checkOut?: string
  workHours?: number
  status?: string
}

interface LeaveRow {
  id: string
  employee?: { firstName?: string; lastName?: string }
  leaveType?: string
  startDate?: string
  daysRequested?: number
  status?: string
}

interface PayrollRow {
  id: string
  employee?: { firstName?: string; lastName?: string }
  baseSalary?: number
  allowances?: number
  deductions?: number
  netSalary?: number
}

const formatCurrency = (value?: number) => (value || value === 0 ? `$${Number(value).toLocaleString()}` : 'N/A')

export const employeeColumns: Column<EmployeeRow>[] = [
  { key: 'employeeNumber', header: 'Employee #' },
  { key: 'name', header: 'Name', render: (_: string | undefined, item) => `${item.firstName ?? ''} ${item.lastName ?? ''}` },
  { key: 'email', header: 'Email' },
  { key: 'department', header: 'Department', render: (_: unknown, item) => item.department?.name || 'N/A' },
  { key: 'hireDate', header: 'Hire Date', render: (value) => (value ? format(new Date(String(value)), 'MMM dd, yyyy') : 'N/A') },
  { key: 'salary', header: 'Salary', render: (value) => formatCurrency(value as number | undefined) },
  {
    key: 'status',
    header: 'Status',
    render: (value) => {
      const status = String(value ?? '')
      const isActive = status.toLowerCase() === 'active'
      return (
        <span
          className={`px-2 py-1 text-xs font-medium rounded-full ${isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}
        >
          {status || '—'}
        </span>
      )
    },
  },
]

export const attendanceColumns: Column<AttendanceRow>[] = [
  { key: 'employee', header: 'Employee', render: (_: unknown, item) => `${item.employee?.firstName ?? ''} ${item.employee?.lastName ?? ''}` },
  { key: 'checkIn', header: 'Check In', render: (value) => (value ? format(new Date(String(value)), 'MMM dd, yyyy HH:mm') : 'N/A') },
  { key: 'checkOut', header: 'Check Out', render: (value) => (value ? format(new Date(String(value)), 'HH:mm') : 'N/A') },
  { key: 'workHours', header: 'Work Hours', render: (value) => (value ? `${Number(value).toFixed(2)}h` : 'N/A') },
  {
    key: 'status',
    header: 'Status',
    render: (value) => {
      const status = String(value ?? '')
      const isPresent = status.toLowerCase() === 'present'
      return (
        <span
          className={`px-2 py-1 text-xs font-medium rounded-full ${isPresent ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
        >
          {status || '—'}
        </span>
      )
    },
  },
]

export const leaveColumns: Column<LeaveRow>[] = [
  { key: 'employee', header: 'Employee', render: (_: unknown, item) => `${item.employee?.firstName ?? ''} ${item.employee?.lastName ?? ''}` },
  { key: 'leaveType', header: 'Type' },
  { key: 'startDate', header: 'Start Date', render: (value) => (value ? format(new Date(String(value)), 'MMM dd, yyyy') : 'N/A') },
  { key: 'daysRequested', header: 'Days' },
  {
    key: 'status',
    header: 'Status',
    render: (value) => {
      const status = String(value ?? '')
      const lower = status.toLowerCase()
      const badgeClass =
        lower === 'approved'
          ? 'bg-green-100 text-green-800'
          : lower === 'pending'
            ? 'bg-yellow-100 text-yellow-800'
            : 'bg-red-100 text-red-800'
      return (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${badgeClass}`}>
          {status || '—'}
        </span>
      )
    },
  },
]

export const payrollColumns: Column<PayrollRow>[] = [
  { key: 'employee', header: 'Employee', render: (_: unknown, item) => `${item.employee?.firstName ?? ''} ${item.employee?.lastName ?? ''}` },
  { key: 'baseSalary', header: 'Base Salary', render: (value) => formatCurrency(value as number | undefined) },
  { key: 'allowances', header: 'Allowances', render: (value) => formatCurrency(value as number | undefined) },
  { key: 'deductions', header: 'Deductions', render: (value) => formatCurrency(value as number | undefined) },
  { key: 'netSalary', header: 'Net Salary', render: (value) => formatCurrency(value as number | undefined) },
]

export const scheduleBaseColumns: Column<ScheduledReport>[] = [
  { key: 'name', header: 'Name' },
  { key: 'type', header: 'Type' },
  { key: 'format', header: 'Format' },
  { key: 'frequency', header: 'Frequency' },
  {
    key: 'lastRun',
    header: 'Last Run',
    render: (_: unknown, item) => {
      const run = Array.isArray(item.runs) && item.runs.length ? item.runs[0] : null
      if (!run) return '—'

      const statusClass =
        run.status === 'success'
          ? 'bg-green-100 text-green-800'
          : run.status === 'failed'
            ? 'bg-red-100 text-red-800'
            : run.status === 'running'
              ? 'bg-blue-100 text-blue-800'
              : 'bg-gray-100 text-gray-800'

      return (
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusClass}`}>{run.status}</span>
          <span className="text-xs text-gray-600">{run.deliveredCount} delivered</span>
        </div>
      )
    },
  },
  {
    key: 'isEnabled',
    header: 'Enabled',
    render: (value) => (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${value ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
        {value ? 'Yes' : 'No'}
      </span>
    ),
  },
  {
    key: 'nextRunAt',
    header: 'Next Run',
    render: (value) => (value ? format(new Date(String(value)), 'MMM dd, yyyy HH:mm') : '—'),
  },
]
