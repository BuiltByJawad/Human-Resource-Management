import { format } from 'date-fns'
import type { BenefitItem } from '@/services/benefits/types'

interface BenefitsEnrollmentsListProps {
  isLoading: boolean
  isError: boolean
  benefits: BenefitItem[]
}

export function BenefitsEnrollmentsList({ isLoading, isError, benefits }: BenefitsEnrollmentsListProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-100 p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Active Enrollments</h2>
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="border rounded-lg p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="space-y-1">
                  <div className="h-4 w-32 bg-gray-100 rounded" />
                  <div className="h-3 w-20 bg-gray-100 rounded" />
                </div>
                <div className="h-4 w-24 bg-gray-100 rounded" />
              </div>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="h-4 w-32 bg-gray-100 rounded" />
                <div className="h-4 w-24 bg-gray-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : isError ? (
        <p className="text-sm text-red-600">Failed to load benefits. Please try again.</p>
      ) : benefits.length === 0 ? (
        <p className="text-sm text-gray-500">You are not currently enrolled in any benefits.</p>
      ) : (
        <div className="space-y-4">
          {benefits.map((benefit) => (
            <div key={benefit.id} className="border rounded-lg p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <p className="font-semibold text-gray-900">{benefit.planName}</p>
                  <p className="text-xs uppercase text-blue-600 font-semibold">{benefit.planType}</p>
                </div>
                <div className="text-sm text-gray-500">${Number(benefit.cost).toFixed(2)} / month</div>
              </div>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-600">
                <div>
                  <p className="text-gray-500 text-xs">Coverage Start</p>
                  <p>{benefit.coverageStartDate ? format(new Date(benefit.coverageStartDate), 'PP') : '—'}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Status</p>
                  <p className="capitalize">{benefit.status}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
