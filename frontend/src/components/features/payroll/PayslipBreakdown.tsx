import type { PayrollRecord } from '@/app/payroll/types'

interface PayslipBreakdownProps {
  payroll: PayrollRecord
}

export function PayslipBreakdown({ payroll }: PayslipBreakdownProps) {
  return (
    <div className="grid grid-cols-2 gap-8 mb-8">
      <div>
        <h4 className="font-semibold text-gray-900 mb-3 border-b pb-2">Earnings</h4>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Basic Salary</span>
            <span className="font-medium">{Number(payroll.baseSalary).toFixed(2)}</span>
          </div>
          {(Array.isArray(payroll.allowancesBreakdown) ? payroll.allowancesBreakdown : []).map((item, index) => (
            <div key={`${item.name}-${index}`} className="flex justify-between">
              <span className="text-gray-600">{item.name}</span>
              <span className="font-medium">{Number(item.amount).toFixed(2)}</span>
            </div>
          ))}
          <div className="flex justify-between pt-2 border-t mt-2 font-semibold">
            <span>Total Earnings</span>
            <span>{(Number(payroll.baseSalary) + Number(payroll.allowances)).toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div>
        <h4 className="font-semibold text-gray-900 mb-3 border-b pb-2">Deductions</h4>
        <div className="space-y-2">
          {(Array.isArray(payroll.deductionsBreakdown) ? payroll.deductionsBreakdown : []).map((item, index) => (
            <div key={`${item.name}-${index}`} className="flex justify-between">
              <span className="text-gray-600">{item.name}</span>
              <span className="font-medium text-red-600">-{Number(item.amount).toFixed(2)}</span>
            </div>
          ))}
          <div className="flex justify-between pt-2 border-t mt-2 font-semibold">
            <span>Total Deductions</span>
            <span className="text-red-600">-{Number(payroll.deductions).toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
