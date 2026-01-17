"use client"

import { DataTable } from '@/components/ui/DataTable'
import { ExportActions } from './ExportActions'
import { TableSkeleton, EmptyState } from './ReportStates'
import { SummaryCard } from './SummaryCard'
import { payrollColumns } from './columns'

interface PayrollSummary {
  totalRecords: number
  totalBaseSalary: number
  totalAllowances: number
  totalDeductions: number
  totalNetSalary: number
}

interface PayrollSectionProps {
  data: { payrollRecords: Array<Record<string, unknown>>; summary?: PayrollSummary } | null
  isLoading: boolean
  onExportCSV: () => void
  onExportPDF: () => void
}

export function PayrollSection({ data, isLoading, onExportCSV, onExportPDF }: PayrollSectionProps) {
  const hasData = Array.isArray(data?.payrollRecords) && data?.payrollRecords.length > 0

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
        <EmptyState message="No payroll records found. Try adjusting your filters." />
      ) : (
        <>
          {data?.summary && (
            <div className="mb-6">
              <SummaryCard
                title="Payroll Summary"
                data={{
                  'Total Records': data.summary.totalRecords,
                  'Total Base Salary': `$${Number(data.summary.totalBaseSalary).toLocaleString()}`,
                  'Total Allowances': `$${Number(data.summary.totalAllowances).toLocaleString()}`,
                  'Total Deductions': `$${Number(data.summary.totalDeductions).toLocaleString()}`,
                  'Total Net Salary': `$${Number(data.summary.totalNetSalary).toLocaleString()}`,
                }}
              />
            </div>
          )}
          <DataTable data={data?.payrollRecords as any} columns={payrollColumns} loading={false} />
        </>
      )}
    </div>
  )
}
