import { useMemo } from 'react'
import { DataTable } from '@/components/ui/DataTable'
import { getPayrollColumns } from '@/components/features/payroll/columns'
import type { PayrollRecord } from '@/services/payroll/types'
import type { MarkPayrollPaidPayload } from '@/components/hrm/MarkPayrollPaidModal'

interface PayrollStatusMutation {
  mutate: (args: { id: string; status: PayrollRecord['status']; meta?: MarkPayrollPaidPayload }) => void
  isPending: boolean
}

interface PayrollRecordsTableProps {
  records: PayrollRecord[]
  isLoading: boolean
  canManagePayrollAction: boolean
  canManagePayrollUi: boolean
  hasHydrated: boolean
  showToast: (message: string, variant?: 'success' | 'error' | 'info' | 'warning') => void
  setOverrideTarget: (target: { employeeId: string; payPeriod: string } | null) => void
  setSelectedPayroll: (record: PayrollRecord) => void
  setIsModalOpen: (isOpen: boolean) => void
  statusMutation: PayrollStatusMutation
  setMarkPaidTarget: (target: { id: string } | null) => void
}

export function PayrollRecordsTable({
  records,
  isLoading,
  canManagePayrollAction,
  canManagePayrollUi,
  hasHydrated,
  showToast,
  setOverrideTarget,
  setSelectedPayroll,
  setIsModalOpen,
  statusMutation,
  setMarkPaidTarget,
}: PayrollRecordsTableProps) {
  const columns = useMemo(
    () =>
      getPayrollColumns({
        canManagePayrollAction,
        canManagePayrollUi,
        hasHydrated,
        showToast,
        setOverrideTarget,
        setSelectedPayroll,
        setIsModalOpen,
        statusMutation,
        setMarkPaidTarget,
      }),
    [
      canManagePayrollAction,
      canManagePayrollUi,
      hasHydrated,
      showToast,
      setOverrideTarget,
      setSelectedPayroll,
      setIsModalOpen,
      statusMutation,
      setMarkPaidTarget,
    ]
  )
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
