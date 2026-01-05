import api from '@/lib/axios'
import type { BenefitPlan, BenefitEnrollment } from '@/features/benefits/types/benefits.types'

const withAuthConfig = (token?: string) => (token ? { headers: { Authorization: `Bearer ${token}` } } : undefined)

const unwrap = <T>(res: any): T => res?.data?.data ?? res?.data ?? res

export async function getBenefitPlans(token?: string): Promise<BenefitPlan[]> {
  const res = await api.get('/benefits/plans', withAuthConfig(token))
  return unwrap<BenefitPlan[]>(res) ?? []
}

export async function createBenefitPlan(
  payload: Omit<BenefitPlan, 'id' | 'createdAt'>,
  token?: string,
): Promise<BenefitPlan> {
  const res = await api.post('/benefits/plans', payload, withAuthConfig(token))
  return unwrap<BenefitPlan>(res)
}

export async function enrollEmployeeInBenefit(
  payload: { employeeId: string; benefitPlanId: string; coverageStartDate: string },
  token?: string,
): Promise<BenefitEnrollment> {
  const res = await api.post('/benefits/enroll', payload, withAuthConfig(token))
  return unwrap<BenefitEnrollment>(res)
}

export async function getEmployeeBenefits(employeeId: string, token?: string): Promise<BenefitEnrollment[]> {
  const res = await api.get(`/benefits/employee/${employeeId}`, withAuthConfig(token))
  return unwrap<BenefitEnrollment[]>(res) ?? []
}

export async function getEmployeeBenefitsWithSummary(employeeId: string, token?: string): Promise<{
  benefits: BenefitEnrollment[]
  summary: { totalEnrollments?: number; activeEnrollments?: number; totalValue?: number } | null
}> {
  if (!employeeId) {
    return { benefits: [], summary: null }
  }

  const res = await api.get(`/benefits/employee/${employeeId}`, withAuthConfig(token))
  const payload = res.data?.data ?? res.data

  if (!payload || typeof payload !== 'object') {
    return { benefits: [], summary: null }
  }

  const benefits = Array.isArray((payload as { benefits?: unknown }).benefits)
    ? ((payload as { benefits?: unknown[] }).benefits as BenefitEnrollment[])
    : Array.isArray(payload)
    ? (payload as BenefitEnrollment[])
    : []

  return {
    benefits,
    summary: (payload as { summary?: any }).summary ?? null,
  }
}
