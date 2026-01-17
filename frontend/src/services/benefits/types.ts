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

export interface BenefitPlanPayload {
  name: string
  type: string
  description?: string
  provider?: string
  costToEmployee: number
  costToCompany: number
}

export interface BenefitEnrollment {
  id: string
  employeeId: string
  benefitPlanId: string
  coverageStartDate: string
  status: string
  benefitPlan?: BenefitPlan
}

export interface BenefitEnrollmentPayload {
  employeeId: string
  benefitPlanId: string
  coverageStartDate: string
}

export interface EmployeeOption {
  id: string
  name: string
  email: string
}

export interface BenefitsSummary {
  totalCostToEmployee: number
  totalCostToCompany: number
}

export interface BenefitItem {
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
  summary: BenefitsSummary | null
}
