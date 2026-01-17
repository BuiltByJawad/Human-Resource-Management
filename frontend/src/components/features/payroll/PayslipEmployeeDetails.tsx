import type { PayrollRecord } from '@/app/payroll/types'

interface PayslipEmployeeDetailsProps {
  payroll: PayrollRecord
}

export function PayslipEmployeeDetails({ payroll }: PayslipEmployeeDetailsProps) {
  return (
    <div className="grid grid-cols-2 gap-8 mb-8">
      <div>
        <p className="text-sm text-gray-500">Employee Name</p>
        <p className="font-medium text-gray-900">{payroll.employee.firstName} {payroll.employee.lastName}</p>
        <p className="text-sm text-gray-500 mt-2">Employee ID</p>
        <p className="font-medium text-gray-900">{payroll.employee.employeeNumber}</p>
      </div>
      <div className="text-right">
        <p className="text-sm text-gray-500">Department</p>
        <p className="font-medium text-gray-900">{payroll.employee.department?.name || 'N/A'}</p>
        <p className="text-sm text-gray-500 mt-2">Pay Date</p>
        <p className="font-medium text-gray-900">{new Date().toLocaleDateString()}</p>
      </div>
    </div>
  )
}
