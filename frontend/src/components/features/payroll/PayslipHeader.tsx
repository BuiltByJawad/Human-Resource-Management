import { useOrgStore } from '@/store/useOrgStore'

interface PayslipHeaderProps {
  payPeriod: string
}

export function PayslipHeader({ payPeriod }: PayslipHeaderProps) {
  const { companyName, companyAddress } = useOrgStore()

  return (
    <div className="text-center border-b pb-6 mb-6">
      <h2 className="text-2xl font-bold text-gray-900">{companyName}</h2>
      <p className="text-sm text-gray-500">{companyAddress}</p>
      <h3 className="text-xl font-semibold mt-4 text-gray-800">PAYSLIP</h3>
      <p className="text-gray-600">Period: {payPeriod}</p>
    </div>
  )
}
