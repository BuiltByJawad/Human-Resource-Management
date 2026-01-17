'use client'

import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/useAuthStore'
import { useToast } from '@/components/ui/ToastProvider'
import type { BenefitPlan, BenefitPlanPayload, BenefitEnrollmentPayload, EmployeeOption } from '@/services/benefits/types'
import {
  createBenefitPlan,
  enrollEmployeeInBenefit,
  fetchBenefitEmployees,
  fetchBenefitPlans,
} from '@/services/benefits/api'

const DEFAULT_PLAN: BenefitPlanPayload = {
  name: '',
  type: 'Health',
  description: '',
  provider: '',
  costToEmployee: 0,
  costToCompany: 0,
}

interface UseBenefitsAdminOptions {
  initialPlans?: BenefitPlan[]
  initialEmployees?: EmployeeOption[]
}

export function useBenefitsAdmin({ initialPlans = [], initialEmployees = [] }: UseBenefitsAdminOptions) {
  const { token } = useAuthStore()
  const { showToast } = useToast()
  const queryClient = useQueryClient()

  const [planForm, setPlanForm] = useState<BenefitPlanPayload>(DEFAULT_PLAN)
  const [enrollForm, setEnrollForm] = useState<BenefitEnrollmentPayload>({
    employeeId: '',
    benefitPlanId: '',
    coverageStartDate: new Date().toISOString().slice(0, 10),
  })

  const plansQuery = useQuery<BenefitPlan[]>({
    queryKey: ['benefits', 'plans'],
    queryFn: fetchBenefitPlans,
    initialData: initialPlans,
    enabled: true,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  })

  const employeesQuery = useQuery<EmployeeOption[]>({
    queryKey: ['benefits', 'employees', token],
    queryFn: () => fetchBenefitEmployees(token ?? undefined),
    initialData: initialEmployees,
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  })

  const createPlanMutation = useMutation({
    mutationFn: createBenefitPlan,
    onSuccess: () => {
      showToast('Benefit plan created', 'success')
      setPlanForm(DEFAULT_PLAN)
      queryClient.invalidateQueries({ queryKey: ['benefits', 'plans'] })
    },
    onError: (err: any) => {
      const message = err?.response?.data?.message || err?.message || 'Failed to create plan'
      showToast(message, 'error')
    },
  })

  const enrollMutation = useMutation({
    mutationFn: enrollEmployeeInBenefit,
    onSuccess: () => {
      showToast('Employee enrolled successfully', 'success')
      setEnrollForm((prev) => ({ ...prev, benefitPlanId: '' }))
    },
    onError: (err: any) => {
      const message = err?.response?.data?.message || err?.message || 'Failed to enroll employee'
      showToast(message, 'error')
    },
  })

  const totalCompanyCost = useMemo(
    () => (plansQuery.data ?? []).reduce((acc, plan) => acc + Number(plan.costToCompany || 0), 0),
    [plansQuery.data]
  )

  const totalEmployeeCost = useMemo(
    () => (plansQuery.data ?? []).reduce((acc, plan) => acc + Number(plan.costToEmployee || 0), 0),
    [plansQuery.data]
  )

  const handlePlanSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    await createPlanMutation.mutateAsync(planForm)
  }

  const handleEnrollSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    await enrollMutation.mutateAsync({
      ...enrollForm,
      coverageStartDate: enrollForm.coverageStartDate,
    })
  }

  return {
    planForm,
    setPlanForm,
    enrollForm,
    setEnrollForm,
    plans: plansQuery.data ?? [],
    employees: employeesQuery.data ?? [],
    loading: plansQuery.isLoading || employeesQuery.isLoading,
    totalCompanyCost,
    totalEmployeeCost,
    handlePlanSubmit,
    handleEnrollSubmit,
    isSubmitting: createPlanMutation.isPending || enrollMutation.isPending,
  }
}
