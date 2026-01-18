import { BanknotesIcon, CheckCircleIcon, ClockIcon } from '@heroicons/react/24/outline'

interface PayrollStatsGridProps {
  totalCost: number
  pendingCount: number
  approvedCount: number
  paidCount: number
}

export function PayrollStatsGrid({ totalCost, pendingCount, approvedCount, paidCount }: PayrollStatsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Total Cost (Period)</p>
            <p className="text-2xl font-bold text-gray-900">${totalCost.toFixed(2)}</p>
          </div>
          <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center">
            <BanknotesIcon className="h-6 w-6 text-blue-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Pending (Draft)</p>
            <p className="text-2xl font-bold text-gray-900">{pendingCount}</p>
          </div>
          <div className="h-12 w-12 rounded-full bg-yellow-50 flex items-center justify-center">
            <ClockIcon className="h-6 w-6 text-yellow-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Approved (Processed)</p>
            <p className="text-2xl font-bold text-gray-900">{approvedCount}</p>
          </div>
          <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center">
            <CheckCircleIcon className="h-6 w-6 text-blue-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Paid</p>
            <p className="text-2xl font-bold text-gray-900">{paidCount}</p>
          </div>
          <div className="h-12 w-12 rounded-full bg-green-50 flex items-center justify-center">
            <CheckCircleIcon className="h-6 w-6 text-green-600" />
          </div>
        </div>
      </div>
    </div>
  )
}
