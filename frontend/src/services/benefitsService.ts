import api from '@/lib/axios'

export interface BenefitPlan {
  id: string
  name: string
  type: string
  description?: string
  provider?: string
  costToEmployee: number
  costToCompany: number
  createdAt: string
}

export interface BenefitEnrollment {
  id: string
  employeeId: string
  benefitPlanId: string
  coverageStartDate: string
  status: string
  benefitPlan?: BenefitPlan
}

export const getBenefitPlans = async (): Promise<BenefitPlan[]> => {
  const res = await api.get('/benefits/plans')
  return res.data.data || res.data
}

export const createBenefitPlan = async (payload: {
  name: string
  type: string
  description?: string
  provider?: string
  costToEmployee: number
  costToCompany: number
}): Promise<BenefitPlan> => {
  const res = await api.post('/benefits/plans', payload)
  return res.data.data || res.data
}

export const enrollEmployeeInBenefit = async (payload: {
  employeeId: string
  benefitPlanId: string
  coverageStartDate: string
}): Promise<BenefitEnrollment> => {
  const res = await api.post('/benefits/enroll', payload)
  return res.data.data || res.data
}

export const getEmployeeBenefits = async (employeeId: string) => {
  const res = await api.get(`/benefits/employee/${employeeId}`)
  return res.data.data || res.data
}
