"use client"

import { ClockIcon, CalendarIcon, UserIcon } from '@heroicons/react/24/outline'
import type { TimeEntry } from '@/services/time-tracking/api'

interface EmployeeOption {
  id: string
  firstName: string
  lastName: string
}

interface TimesheetPanelProps {
  employees: EmployeeOption[]
  selectedEmployee: string
  onSelectEmployee: (employeeId: string) => void
  isLoading: boolean
  timeEntries: TimeEntry[]
}

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  completed: 'bg-blue-100 text-blue-800',
  archived: 'bg-gray-100 text-gray-800',
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
}

function formatDuration(minutes?: number) {
  if (!minutes) return '-'
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours}h ${mins}m`
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

export function TimesheetPanel({ employees, selectedEmployee, onSelectEmployee, isLoading, timeEntries }: TimesheetPanelProps) {
  return (
    <div>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-6">
        <div className="flex items-center gap-4">
          <UserIcon className="h-5 w-5 text-gray-400" />
          <select
            value={selectedEmployee}
            onChange={(e) => onSelectEmployee(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select an employee to view timesheet...</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.firstName} {emp.lastName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!selectedEmployee ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100 shadow-sm">
          <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">Select an employee</h3>
          <p className="mt-2 text-sm text-gray-500">Choose an employee above to view their timesheet.</p>
        </div>
      ) : isLoading ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto" />
          <p className="mt-4 text-sm text-gray-500">Loading timesheet...</p>
        </div>
      ) : timeEntries.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100 shadow-sm">
          <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No time entries</h3>
          <p className="mt-2 text-sm text-gray-500">This employee has no time entries yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {timeEntries.map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(entry.date)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{entry.project?.name || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {formatTime(entry.startTime)}
                    {entry.endTime && ` - ${formatTime(entry.endTime)}`}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{formatDuration(entry.duration)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[entry.status] || 'bg-gray-100 text-gray-800'}`}
                    >
                      {entry.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
