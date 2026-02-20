"use client"

import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'

import { useToast } from '@/components/ui/ToastProvider'
import { fetchEmployeeBenefits } from '@/services/benefits/api'
import type { BenefitsResponse } from '@/services/benefits/types'
import { handleCrudError } from '@/lib/apiError'
import { Skeleton } from '@/components/ui/Skeleton'
import { BenefitsEnrollmentsList, BenefitsHeader, BenefitsSummaryCards } from '@/components/features/benefits'

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

  const {
    data: benefitsData = EMPTY_STATE,
    isLoading,
    isError,
    error
  } = useQuery<BenefitsResponse, Error>({
    queryKey: ['benefits', employeeId],
    queryFn: () => fetchEmployeeBenefits(employeeId as string),
    enabled: !!employeeId,
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
    <div className="p-4 md:p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <BenefitsHeader title="My Benefits" subtitle="View the benefits you are enrolled in." />

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-24 w-full rounded-lg" />
            ))}
          </div>
        ) : summary ? (
          <BenefitsSummaryCards
            totalCompanyCost={summary.totalCostToCompany}
            totalEmployeeCost={summary.totalCostToEmployee}
          />
        ) : null}

        <BenefitsEnrollmentsList
          isLoading={isLoading}
          isError={isError}
          benefits={benefits}
        />
      </div>
    </div>
  )
}
