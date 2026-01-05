import api from '@/lib/axios'
import type {
  OnboardingProcess,
  OnboardingTask,
  OnboardingTaskPayload,
} from '@/features/onboarding/types/onboarding.types'

const withAuthConfig = (token?: string) => (token ? { headers: { Authorization: `Bearer ${token}` } } : undefined)

const unwrap = <T>(res: any): T => res?.data?.data ?? res?.data ?? res

export const startOnboardingProcess = async (
  employeeId: string,
  payload?: { startDate?: string; dueDate?: string },
  token?: string,
): Promise<OnboardingProcess> => {
  const res = await api.post(`/onboarding/process/${employeeId}/start`, payload ?? {}, withAuthConfig(token))
  return unwrap<OnboardingProcess>(res)
}

export const getOnboardingProcess = async (employeeId: string, token?: string): Promise<OnboardingProcess> => {
  const res = await api.get(`/onboarding/process/${employeeId}`, withAuthConfig(token))
  return unwrap<OnboardingProcess>(res)
}

export const createOnboardingTask = async (
  employeeId: string,
  payload: OnboardingTaskPayload,
  token?: string,
): Promise<OnboardingTask> => {
  const res = await api.post(`/onboarding/process/${employeeId}/tasks`, payload, withAuthConfig(token))
  return unwrap<OnboardingTask>(res)
}

export const updateOnboardingTask = async (
  taskId: string,
  payload: Partial<OnboardingTaskPayload>,
  token?: string,
): Promise<OnboardingTask> => {
  const res = await api.patch(`/onboarding/tasks/${taskId}`, payload, withAuthConfig(token))
  return unwrap<OnboardingTask>(res)
}

export const completeOnboardingTask = async (taskId: string, token?: string): Promise<OnboardingTask> => {
  const res = await api.post(`/onboarding/tasks/${taskId}/complete`, undefined, withAuthConfig(token))
  return unwrap<OnboardingTask>(res)
}
