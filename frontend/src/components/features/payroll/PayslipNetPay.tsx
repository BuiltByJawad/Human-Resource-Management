import type { PayrollRecord } from '@/services/payroll/types'

interface PayslipNetPayProps {
  payroll: PayrollRecord
}

export function PayslipNetPay({ payroll }: PayslipNetPayProps) {
  return (
    <div className="bg-gray-50 p-4 rounded-lg flex justify-between items-center border border-gray-200">
      <div>
        <p className="text-sm text-gray-500">Net Payable</p>
        <p className="text-xs text-gray-400">In words: {Number(payroll.netSalary).toFixed(2)} Only</p>
      </div>
      <div className="text-2xl font-bold text-gray-900">
        ${Number(payroll.netSalary).toFixed(2)}
      </div>
    </div>
  )
}
