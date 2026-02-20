"use client"

import { LazyDatePicker } from '@/components/ui/LazyDatePicker'
import { Select } from '@/components/ui/CustomSelect'

interface ReportFiltersBarProps {
  startDate: Date | null
  endDate: Date | null
  departmentId: string
  onStartDateChange: (date: Date | null) => void
  onEndDateChange: (date: Date | null) => void
  onDepartmentChange: (value: string) => void
  departments: Array<{ value: string; label: string }>
  onClear?: () => void
}

export function ReportFiltersBar({
  startDate,
  endDate,
  departmentId,
  onStartDateChange,
  onEndDateChange,
  onDepartmentChange,
  departments,
  onClear,
}: ReportFiltersBarProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
        <button
          type="button"
          onClick={onClear}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
        >
          Clear All
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <LazyDatePicker
          label="Start Date"
          value={startDate}
          onChange={onStartDateChange}
          maxDate={endDate || new Date()}
        />
        <LazyDatePicker
          label="End Date"
          value={endDate}
          onChange={onEndDateChange}
          minDate={startDate || undefined}
          maxDate={new Date()}
        />
        <Select
          label="Department"
          value={departmentId}
          onChange={onDepartmentChange}
          options={[{ value: '', label: 'All Departments' }, ...departments]}
        />
      </div>
    </div>
  )
}
