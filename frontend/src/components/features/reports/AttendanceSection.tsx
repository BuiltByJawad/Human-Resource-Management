"use client"

import { DataTable } from '@/components/ui/DataTable'
import { ExportActions } from './ExportActions'
import { TableSkeleton, EmptyState } from './ReportStates'
import { SummaryCard } from './SummaryCard'
import { attendanceColumns } from './columns'

interface AttendanceSummary {
  totalRecords: number
  presentDays: number
  absentDays: number
  lateDays: number
  totalWorkHours: number
  totalOvertimeHours: number
}

interface AttendanceSectionProps {
  data: { attendance: Array<Record<string, unknown>>; summary?: AttendanceSummary } | null
  isLoading: boolean
  onExportCSV: () => void
  onExportPDF: () => void
}

export function AttendanceSection({ data, isLoading, onExportCSV, onExportPDF }: AttendanceSectionProps) {
  const hasData = Array.isArray(data?.attendance) && data?.attendance.length > 0

  return (
    <div>
      {hasData && (
        <div className="flex justify-end mb-4">
          <ExportActions onExportCSV={onExportCSV} onExportPDF={onExportPDF} />
        </div>
      )}

      {isLoading ? (
        <TableSkeleton />
      ) : !hasData ? (
        <EmptyState message="No attendance records found. Try adjusting your filters." />
      ) : (
        <>
          {data?.summary && (
            <div className="mb-6">
              <SummaryCard
                title="Attendance Summary"
                data={{
                  'Total Records': data.summary.totalRecords,
                  'Present Days': data.summary.presentDays,
                  'Absent Days': data.summary.absentDays,
                  'Late Days': data.summary.lateDays,
                  'Total Work Hours': `${data.summary.totalWorkHours?.toFixed?.(2) ?? 0}h`,
                  'Total Overtime': `${data.summary.totalOvertimeHours?.toFixed?.(2) ?? 0}h`,
                }}
              />
            </div>
          )}
          <DataTable data={data?.attendance as any} columns={attendanceColumns} loading={false} />
        </>
      )}
    </div>
  )
}
