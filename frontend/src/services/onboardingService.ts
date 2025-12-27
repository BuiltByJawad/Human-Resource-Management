import api from '@/lib/axios'

export interface OnboardingTaskPayload {
  title: string
  description?: string
  assigneeUserId?: string
  dueDate?: string
}

export const startOnboardingProcess = async (employeeId: string, payload?: { startDate?: string; dueDate?: string }) => {
  const res = await api.post(`/onboarding/process/${employeeId}/start`, payload ?? {})
  return res.data.data || res.data
}

export const getOnboardingProcess = async (employeeId: string) => {
  const res = await api.get(`/onboarding/process/${employeeId}`)
  return res.data.data || res.data
}

export const createOnboardingTask = async (employeeId: string, payload: OnboardingTaskPayload) => {
  const res = await api.post(`/onboarding/process/${employeeId}/tasks`, payload)
  return res.data.data || res.data
}

export const updateOnboardingTask = async (taskId: string, payload: Partial<OnboardingTaskPayload>) => {
  const res = await api.patch(`/onboarding/tasks/${taskId}`, payload)
  return res.data.data || res.data
}

export const completeOnboardingTask = async (taskId: string) => {
  const res = await api.post(`/onboarding/tasks/${taskId}/complete`)
  return res.data.data || res.data
}
