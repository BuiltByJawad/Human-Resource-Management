interface BenefitsSummaryCardsProps {
  totalCompanyCost: number
  totalEmployeeCost: number
}

export function BenefitsSummaryCards({ totalCompanyCost, totalEmployeeCost }: BenefitsSummaryCardsProps) {
  return (
    <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-white rounded-lg border border-gray-100 p-4 shadow-sm">
        <p className="text-sm text-gray-500">Monthly Cost to Employees</p>
        <p className="text-2xl font-semibold text-gray-900 mt-1">${totalEmployeeCost.toFixed(2)}</p>
      </div>
      <div className="bg-white rounded-lg border border-gray-100 p-4 shadow-sm">
        <p className="text-sm text-gray-500">Monthly Cost to Company</p>
        <p className="text-2xl font-semibold text-gray-900 mt-1">${totalCompanyCost.toFixed(2)}</p>
      </div>
    </section>
  )
}
