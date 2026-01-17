import { DataTable, type Column } from '@/components/ui/DataTable'
import type { PayrollRecord } from '@/services/payroll/types'

interface PayrollRecordsTableProps {
  columns: Column<PayrollRecord>[]
  records: PayrollRecord[]
  isLoading: boolean
}

export function PayrollRecordsTable({ columns, records, isLoading }: PayrollRecordsTableProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900">Payroll Records</h2>
        <div className="text-sm text-gray-500">{isLoading ? 'Loading...' : `${records.length} records`}</div>
      </div>

      <DataTable columns={columns} data={records} loading={isLoading} />
    </div>
  )
}
