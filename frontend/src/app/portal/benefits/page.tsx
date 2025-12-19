"use client"

import React, { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import Sidebar from '@/components/ui/Sidebar'
import Header from '@/components/ui/Header'
import { useAuthStore } from '@/store/useAuthStore'
import { useToast } from '@/components/ui/ToastProvider'
import { getEmployeeBenefits } from '@/services/benefitsService'
import { format } from 'date-fns'
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

interface BenefitsResponse {
  benefits: BenefitItem[]
  summary: BenefitSummary | null
}

export default function MyBenefitsPage() {
  const { user } = useAuthStore()
  const { showToast } = useToast()

  const {
    data: benefitsData,
    isLoading,
    isError,
    error,
  } = useQuery<BenefitsResponse, Error>({
    queryKey: ['benefits', user?.employee?.id],
    queryFn: () => getEmployeeBenefits(user?.employee?.id as string),
    enabled: !!user?.employee?.id,
    retry: false,
    initialData: { benefits: [], summary: null },
  })

  useEffect(() => {
    if (isError && error) {
      handleCrudError({
        error,
        resourceLabel: 'Benefits',
        showToast,
      })
    }
  }, [isError, error, showToast])

  const benefits = benefitsData?.benefits || []
  const summary = benefitsData?.summary || null

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
          </div>
        </main>
      </div>
    </div>
  )
}
