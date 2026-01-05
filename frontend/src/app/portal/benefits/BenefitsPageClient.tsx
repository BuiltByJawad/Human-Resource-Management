"use client"

import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'

import Sidebar from '@/components/ui/Sidebar'
import Header from '@/components/ui/Header'
import { useToast } from '@/components/ui/ToastProvider'
import { getEmployeeBenefits, type BenefitEnrollment } from '@/features/benefits'
import { useAuth } from '@/features/auth'
import { handleCrudError } from '@/lib/apiError'
import { Skeleton } from '@/components/ui/Skeleton'

interface BenefitSummary {
  totalCostToEmployee: number
  totalCostToCompany: number
}

interface BenefitItem {
  id: string
  benefitPlanId: string
  coverageStartDate: string
  status: string
  planName: string
  planType: string
  cost: number
}

export interface BenefitsResponse {
  benefits: BenefitItem[]
  summary: BenefitSummary | null
}

interface BenefitsPageClientProps {
  employeeId: string | null
  initialBenefits: BenefitsResponse
}

const EMPTY_STATE: BenefitsResponse = {
  benefits: [],
  summary: null
}

export function BenefitsPageClient({ employeeId, initialBenefits }: BenefitsPageClientProps) {
  const { showToast } = useToast()
  const { token } = useAuth()

  const {
    data: benefitsData = EMPTY_STATE,
    isLoading,
    isError,
    error
  } = useQuery<BenefitsResponse, Error>({
    queryKey: ['benefits', employeeId],
    queryFn: async () => {
      const enrollments = await getEmployeeBenefits(employeeId as string, token ?? undefined)
      const benefits = (enrollments ?? []).map((enrollment: BenefitEnrollment) => ({
        id: enrollment.id,
        benefitPlanId: enrollment.benefitPlanId,
        coverageStartDate: enrollment.coverageStartDate,
        status: enrollment.status,
        planName: enrollment.benefitPlan?.name ?? '',
        planType: enrollment.benefitPlan?.type ?? '',
        cost: enrollment.benefitPlan?.costToEmployee ?? 0,
      }))
      return { benefits, summary: null }
    },
    enabled: !!employeeId && !!token,
    retry: false,
    initialData: employeeId ? initialBenefits : EMPTY_STATE
  })

  useEffect(() => {
    if (isError && error) {
      handleCrudError({
        error,
        resourceLabel: 'Benefits',
        showToast
      })
    }
  }, [isError, error, showToast])

  const benefits = benefitsData.benefits || []
  const summary = benefitsData.summary

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-6">
          <div className="max-w-5xl mx-auto space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Benefits</h1>
              <p className="text-gray-600">View the benefits you are enrolled in.</p>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-24 w-full rounded-lg" />
                ))}
              </div>
            ) : summary ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white rounded-lg border border-gray-100 p-4 shadow-sm">
                  <p className="text-sm text-gray-500">Monthly Cost to You</p>
                  <p className="text-2xl font-semibold text-gray-900 mt-1">
                    ${summary.totalCostToEmployee.toFixed(2)}
                  </p>
                </div>
                <div className="bg-white rounded-lg border border-gray-100 p-4 shadow-sm">
                  <p className="text-sm text-gray-500">Monthly Cost Covered by Company</p>
                  <p className="text-2xl font-semibold text-gray-900 mt-1">
                    ${summary.totalCostToCompany.toFixed(2)}
                  </p>
                </div>
              </div>
            ) : null}

            <div className="bg-white rounded-lg border border-gray-100 p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Active Enrollments</h2>
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2].map((i) => (
                    <div key={i} className="border rounded-lg p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="space-y-1">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-20" />
                        </div>
                        <Skeleton className="h-4 w-24" />
                      </div>
                      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : isError ? (
                <p className="text-sm text-red-600">Failed to load benefits. Please try again.</p>
              ) : benefits.length === 0 ? (
                <p className="text-sm text-gray-500">
                  {employeeId
                    ? 'You are not currently enrolled in any benefits.'
                    : 'We could not determine your employee profile.'}
                </p>
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
                          <p>
                            {benefit.coverageStartDate ? format(new Date(benefit.coverageStartDate), 'PP') : '—'}
                          </p>
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
          </div>
        </main>
      </div>
    </div>
  )
}
