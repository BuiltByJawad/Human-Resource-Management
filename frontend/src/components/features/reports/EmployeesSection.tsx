"use client"

import { DataTable } from '@/components/ui/DataTable'
import { ExportActions } from './ExportActions'
import { TableSkeleton, EmptyState } from './ReportStates'
import { employeeColumns } from './columns'

interface EmployeesSectionProps {
  data: Array<Record<string, unknown>>
  isLoading: boolean
  onExportCSV: () => void
  onExportPDF: () => void
}

export function EmployeesSection({ data, isLoading, onExportCSV, onExportPDF }: EmployeesSectionProps) {
  const hasData = Array.isArray(data) && data.length > 0

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
        <EmptyState message="No employees found. Try adjusting your filters." />
      ) : (
        <DataTable
          data={data as any}
          columns={employeeColumns}
          loading={false}
          searchKeys={["firstName", "lastName", "email", "employeeNumber", "department.name"]}
        />
      )}
    </div>
  )
}
