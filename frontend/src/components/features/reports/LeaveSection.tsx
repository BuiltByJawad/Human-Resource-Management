"use client"

import { DataTable } from '@/components/ui/DataTable'
import { ExportActions } from './ExportActions'
import { TableSkeleton, EmptyState } from './ReportStates'
import { SummaryCard } from './SummaryCard'
import { leaveColumns } from './columns'

interface LeaveSummary {
  totalRequests: number
  approvedRequests: number
  pendingRequests: number
  rejectedRequests: number
  totalDaysRequested: number
}

interface LeaveSectionProps {
  data: { leaveRequests: Array<Record<string, unknown>>; summary?: LeaveSummary } | null
  isLoading: boolean
  onExportCSV: () => void
  onExportPDF: () => void
}

export function LeaveSection({ data, isLoading, onExportCSV, onExportPDF }: LeaveSectionProps) {
  const hasData = Array.isArray(data?.leaveRequests) && data?.leaveRequests.length > 0

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
        <EmptyState message="No leave requests found. Try adjusting your filters." />
      ) : (
        <>
          {data?.summary && (
            <div className="mb-6">
              <SummaryCard
                title="Leave Summary"
                data={{
                  'Total Requests': data.summary.totalRequests,
                  Approved: data.summary.approvedRequests,
                  Pending: data.summary.pendingRequests,
                  Rejected: data.summary.rejectedRequests,
                  'Total Days Requested': data.summary.totalDaysRequested,
                }}
              />
            </div>
          )}
          <DataTable data={data?.leaveRequests as any} columns={leaveColumns} loading={false} />
        </>
      )}
    </div>
  )
}
