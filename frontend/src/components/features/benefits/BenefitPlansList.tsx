import { format } from 'date-fns'
import type { BenefitPlan } from '@/services/benefits/types'

interface BenefitPlansListProps {
  plans: BenefitPlan[]
  isLoading: boolean
  totalCompanyCost: number
  totalEmployeeCost: number
}

export function BenefitPlansList({ plans, isLoading, totalCompanyCost, totalEmployeeCost }: BenefitPlansListProps) {
  return (
    <section className="bg-white rounded-lg shadow border border-gray-100 p-5">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Benefit Plans</h2>
          <p className="text-sm text-gray-600">{plans.length} plans created</p>
        </div>
        <div className="flex gap-4 text-sm">
          <div>
            <p className="text-gray-500">Total Company Cost</p>
            <p className="text-lg font-semibold text-gray-900">${totalCompanyCost.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-gray-500">Total Employee Cost</p>
            <p className="text-lg font-semibold text-gray-900">${totalEmployeeCost.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-gray-500">Loading plans...</p>
      ) : plans.length === 0 ? (
        <div className="text-center py-10 text-gray-500 border rounded-lg border-dashed">No benefit plans yet.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {plans.map((plan) => (
            <div key={plan.id} className="border rounded-lg p-4 bg-white shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base font-semibold text-gray-900">{plan.name}</p>
                  <p className="text-xs uppercase tracking-wide text-blue-600 font-semibold">{plan.type}</p>
                </div>
                <p className="text-sm text-gray-500">${Number(plan.costToEmployee).toFixed(2)} / employee</p>
              </div>
              {plan.description && <p className="text-sm text-gray-600 mt-2">{plan.description}</p>}
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded bg-gray-50 px-3 py-2">
                  <p className="text-gray-500 text-xs">Employee Cost</p>
                  <p className="font-semibold text-gray-900">${Number(plan.costToEmployee).toFixed(2)}</p>
                </div>
                <div className="rounded bg-gray-50 px-3 py-2">
                  <p className="text-gray-500 text-xs">Company Cost</p>
                  <p className="font-semibold text-gray-900">${Number(plan.costToCompany).toFixed(2)}</p>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-3">
                Created {plan.createdAt ? format(new Date(plan.createdAt), 'PP') : '—'}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
