'use client'

import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/components/ui/ToastProvider'
import { useAuthStore } from '@/store/useAuthStore'
import type { Employee } from '@/services/employees/types'
import type { OnboardingProcess, OnboardingTask, OnboardingTaskPayload } from '@/services/onboarding/types'
import { fetchEmployeeById } from '@/services/employees/api'
import {
  startOnboardingProcess,
  getOnboardingProcess,
  createOnboardingTask,
  completeOnboardingTask,
} from '@/services/onboarding/api'

const DEFAULT_TASK: OnboardingTaskPayload = {
  title: '',
  description: '',
  dueDate: '',
}

interface UseEmployeeOnboardingOptions {
  employeeId?: string
}

export function useEmployeeOnboarding({ employeeId }: UseEmployeeOnboardingOptions) {
  const { token } = useAuthStore()
  const { showToast } = useToast()
  const queryClient = useQueryClient()

  const [newTask, setNewTask] = useState<OnboardingTaskPayload>(DEFAULT_TASK)

  const employeeQuery = useQuery<Employee>({
    queryKey: ['employee', employeeId, token],
    queryFn: async () => fetchEmployeeById(employeeId ?? ''),
    enabled: Boolean(employeeId && token),
  })

  const onboardingQuery = useQuery<OnboardingProcess>({
    queryKey: ['onboarding-process', employeeId, token],
    queryFn: async () => {
      await startOnboardingProcess(employeeId ?? '')
      return getOnboardingProcess(employeeId ?? '')
    },
    enabled: Boolean(employeeId && token),
  })

  const createTaskMutation = useMutation({
    mutationFn: (payload: OnboardingTaskPayload) => createOnboardingTask(employeeId ?? '', payload),
    onSuccess: () => {
      showToast('Task added successfully', 'success')
      setNewTask(DEFAULT_TASK)
      queryClient.invalidateQueries({ queryKey: ['onboarding-process', employeeId] })
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Failed to create task'
      showToast(message, 'error')
    },
  })

  const completeTaskMutation = useMutation({
    mutationFn: (taskId: string) => completeOnboardingTask(taskId),
    onSuccess: () => {
      showToast('Task marked as complete', 'success')
      queryClient.invalidateQueries({ queryKey: ['onboarding-process', employeeId] })
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Failed to complete task'
      showToast(message, 'error')
    },
  })

  const tasks = useMemo<OnboardingTask[]>(() => onboardingQuery.data?.tasks ?? [], [onboardingQuery.data])
  const isLoading = employeeQuery.isLoading || onboardingQuery.isLoading

  return {
    employee: employeeQuery.data,
    tasks,
    isLoading,
    newTask,
    setNewTask,
    createTaskMutation,
    completeTaskMutation,
  }
}
