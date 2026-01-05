import api from '@/lib/axios'
import type { OffboardingProcess, OffboardingTask } from '@/features/offboarding/types/offboarding.types'

const withAuthConfig = (token?: string) => (token ? { headers: { Authorization: `Bearer ${token}` } } : undefined)

const unwrap = <T>(res: any): T => res?.data?.data ?? res?.data ?? res

export const getOffboardingProcesses = async (token?: string): Promise<OffboardingProcess[]> => {
  const res = await api.get('/offboarding', withAuthConfig(token))
  return unwrap<OffboardingProcess[]>(res) ?? []
}

export const initiateOffboarding = async (
  payload: {
    employeeId: string
    exitDate: string
    reason?: string
    notes?: string
  },
  token?: string,
): Promise<OffboardingProcess> => {
  const res = await api.post('/offboarding/initiate', payload, withAuthConfig(token))
  return unwrap<OffboardingProcess>(res)
}

export const getEmployeeOffboarding = async (employeeId: string, token?: string): Promise<OffboardingProcess> => {
  const res = await api.get(`/offboarding/${employeeId}`, withAuthConfig(token))
  return unwrap<OffboardingProcess>(res)
}

export const updateOffboardingTask = async (
  taskId: string,
  payload: { status: OffboardingTask['status'] },
  token?: string,
): Promise<OffboardingTask> => {
  const res = await api.patch(`/offboarding/tasks/${taskId}`, payload, withAuthConfig(token))
  return unwrap<OffboardingTask>(res)
}
