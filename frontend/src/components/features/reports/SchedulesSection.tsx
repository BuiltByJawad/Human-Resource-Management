"use client"

import { Button } from '@/components/ui/FormComponents'
import { DataTable } from '@/components/ui/DataTable'
import { EmptyState, TableSkeleton } from './ReportStates'
import { scheduleBaseColumns } from './columns'
import type { ScheduledReport } from '@/services/reports/api'

interface SchedulesSectionProps {
  schedules: ScheduledReport[]
  isLoading: boolean
  onCreate: () => void
  onToggleEnabled: (id: string, next: boolean) => void
  onEdit: (schedule: ScheduledReport) => void
  onHistory: (schedule: ScheduledReport) => void
  onRunNow: (id: string) => void
  onDelete: (schedule: ScheduledReport) => void
  togglePendingId?: string
  runNowPendingId?: string
  deletePendingId?: string
}

export function SchedulesSection({
  schedules,
  isLoading,
  onCreate,
  onToggleEnabled,
  onEdit,
  onHistory,
  onRunNow,
  onDelete,
  togglePendingId,
  runNowPendingId,
  deletePendingId,
}: SchedulesSectionProps) {
  const hasData = Array.isArray(schedules) && schedules.length > 0

  const columns = [
    ...scheduleBaseColumns,
    {
      key: 'actions',
      header: 'Actions',
      render: (_: unknown, item: ScheduledReport) => (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            loading={togglePendingId === item.id}
            onClick={() => onToggleEnabled(item.id, !item.isEnabled)}
          >
            {item.isEnabled ? 'Disable' : 'Enable'}
          </Button>
          <Button size="sm" variant="outline" onClick={() => onEdit(item)}>
            Edit
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onHistory(item)}
          >
            History
          </Button>
          <Button
            size="sm"
            variant="primary"
            loading={runNowPendingId === item.id}
            onClick={() => onRunNow(item.id)}
          >
            Run now
          </Button>
          <Button
            size="sm"
            variant="danger"
            loading={deletePendingId === item.id}
            onClick={() => onDelete(item)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <div className="flex items-center justify-end mb-4">
        <Button onClick={onCreate}>Create schedule</Button>
      </div>

      {isLoading ? (
        <TableSkeleton />
      ) : !hasData ? (
        <EmptyState message="No schedules yet. Create one to automatically email reports." />
      ) : (
        <DataTable data={schedules} columns={columns as any} loading={false} />
      )}
    </div>
  )
}
