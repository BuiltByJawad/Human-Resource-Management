import api from '@/lib/axios'
import type { OnboardingProcess, OnboardingTask, OnboardingTaskPayload } from '@/services/onboarding/types'

export const startOnboardingProcess = async (
  employeeId: string,
  payload?: { startDate?: string; dueDate?: string }
): Promise<OnboardingProcess> => {
  const res = await api.post(`/onboarding/process/${employeeId}/start`, payload ?? {})
  return (res.data?.data ?? res.data) as OnboardingProcess
}

export const getOnboardingProcess = async (employeeId: string): Promise<OnboardingProcess> => {
  const res = await api.get(`/onboarding/process/${employeeId}`)
  return (res.data?.data ?? res.data) as OnboardingProcess
}

export const createOnboardingTask = async (
  employeeId: string,
  payload: OnboardingTaskPayload
): Promise<OnboardingTask> => {
  const res = await api.post(`/onboarding/process/${employeeId}/tasks`, payload)
  return (res.data?.data ?? res.data) as OnboardingTask
}

export const updateOnboardingTask = async (
  taskId: string,
  payload: Partial<OnboardingTaskPayload>
): Promise<OnboardingTask> => {
  const res = await api.patch(`/onboarding/tasks/${taskId}`, payload)
  return (res.data?.data ?? res.data) as OnboardingTask
}

export const completeOnboardingTask = async (taskId: string): Promise<OnboardingTask> => {
  const res = await api.post(`/onboarding/tasks/${taskId}/complete`)
  return (res.data?.data ?? res.data) as OnboardingTask
}
