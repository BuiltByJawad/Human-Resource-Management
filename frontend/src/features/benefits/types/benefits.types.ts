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
