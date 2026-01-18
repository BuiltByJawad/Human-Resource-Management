"use client"

import { AdjustmentsHorizontalIcon, CheckCircleIcon, DocumentTextIcon } from '@heroicons/react/24/outline'

import type { Column } from '@/components/ui/DataTable'
import type { MarkPayrollPaidPayload } from '@/components/hrm/MarkPayrollPaidModal'
import type { PayrollRecord } from '@/services/payroll/types'

interface PayrollStatusMutation {
  mutate: (args: { id: string; status: PayrollRecord['status']; meta?: MarkPayrollPaidPayload }) => void
  isPending: boolean
}

interface PayrollColumnOptions {
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

export const getPayrollColumns = ({
  canManagePayrollAction,
  canManagePayrollUi,
  hasHydrated,
  showToast,
  setOverrideTarget,
  setSelectedPayroll,
  setIsModalOpen,
  statusMutation,
  setMarkPaidTarget,
}: PayrollColumnOptions): Column<PayrollRecord>[] => [
  {
    header: 'Employee',
    key: 'employee',
    render: (_, record) => (
      <div>
        <div className="font-medium text-gray-900">
          {record.employee.firstName} {record.employee.lastName}
        </div>
        <div className="text-xs text-gray-500">{record.employee.employeeNumber}</div>
      </div>
    ),
  },
  {
    header: 'Period',
    key: 'payPeriod',
    render: (val) => <span className="font-mono text-sm">{val}</span>,
  },
  {
    header: 'Net Salary',
    key: 'netSalary',
    render: (val) => <span className="font-semibold text-gray-900">${Number(val).toFixed(2)}</span>,
  },
  {
    header: 'Status',
    key: 'status',
    render: (val: PayrollRecord['status']) => {
      const colors: Record<PayrollRecord['status'], string> = {
        draft: 'bg-yellow-100 text-yellow-800',
        processed: 'bg-blue-100 text-blue-800',
        paid: 'bg-green-100 text-green-800',
        error: 'bg-red-100 text-red-800',
      }
      return (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[val] || 'bg-gray-100'}`}>
          {val.toUpperCase()}
        </span>
      )
    },
  },
  {
    header: 'Actions',
    key: 'actions',
    render: (_, record) => (
      <div className="flex space-x-2 justify-end">
        <button
          onClick={() => {
            if (!canManagePayrollAction) {
              if (!hasHydrated) {
                showToast('Loading permissions...', 'info')
              }
              return
            }
            setOverrideTarget({ employeeId: record.employeeId, payPeriod: record.payPeriod })
          }}
          disabled={hasHydrated && !canManagePayrollAction}
          className={`p-1 ${canManagePayrollUi ? 'text-gray-700 hover:text-gray-900' : 'text-gray-300 cursor-not-allowed'}`}
          title="Override payroll adjustments"
        >
          <span className="sr-only">Override payroll adjustments</span>
          <AdjustmentsHorizontalIcon className="h-5 w-5" />
        </button>
        <button
          onClick={() => {
            setSelectedPayroll(record)
            setIsModalOpen(true)
          }}
          className="text-blue-600 hover:text-blue-900 p-1"
          title="View Payslip"
        >
          <span className="sr-only">View payslip</span>
          <DocumentTextIcon className="h-5 w-5" />
        </button>
        {record.status === 'draft' && (
          <button
            onClick={() => statusMutation.mutate({ id: record.id, status: 'processed' })}
            disabled={statusMutation.isPending}
            className="text-blue-600 hover:text-blue-900 p-1 disabled:opacity-50"
            title="Approve Payroll"
          >
            <span className="sr-only">Approve payroll</span>
            <CheckCircleIcon className="h-5 w-5" />
          </button>
        )}
        {record.status === 'processed' && (
          <button
            onClick={() => setMarkPaidTarget({ id: record.id })}
            disabled={statusMutation.isPending}
            className="text-green-600 hover:text-green-900 p-1 disabled:opacity-50"
            title="Mark as Paid"
          >
            <span className="sr-only">Mark as paid</span>
            <CheckCircleIcon className="h-5 w-5" />
          </button>
        )}
      </div>
    ),
  },
]
