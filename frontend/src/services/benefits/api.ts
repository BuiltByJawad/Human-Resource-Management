import api from '@/lib/axios'
import type { BenefitEnrollment, BenefitPlan, BenefitPlanPayload, BenefitEnrollmentPayload, EmployeeOption } from './types'

const withAuth = (token?: string) => (token ? { headers: { Authorization: `Bearer ${token}` } } : undefined)

export const fetchBenefitPlans = async (): Promise<BenefitPlan[]> => {
  const res = await api.get('/benefits/plans')
  return res.data.data || res.data
}

export const createBenefitPlan = async (payload: BenefitPlanPayload): Promise<BenefitPlan> => {
  const res = await api.post('/benefits/plans', payload)
  return res.data.data || res.data
}

export const enrollEmployeeInBenefit = async (payload: BenefitEnrollmentPayload): Promise<BenefitEnrollment> => {
  const res = await api.post('/benefits/enroll', payload)
  return res.data.data || res.data
}

export const fetchEmployeeBenefits = async (employeeId: string) => {
  const res = await api.get(`/benefits/employee/${employeeId}`)
  return res.data.data || res.data
}

export const fetchBenefitEmployees = async (token?: string): Promise<EmployeeOption[]> => {
  const response = await api.get('/employees', {
    params: { limit: 200 },
    ...(withAuth(token) ?? {}),
  })
  const payload = response.data?.data ?? response.data ?? []
  const employees = Array.isArray(payload?.employees) ? payload.employees : Array.isArray(payload) ? payload : []
  return employees.map((emp: any) => ({
    id: emp.id,
    name: `${emp.firstName ?? ''} ${emp.lastName ?? ''}`.trim() || emp.email,
    email: emp.email,
  }))
}
