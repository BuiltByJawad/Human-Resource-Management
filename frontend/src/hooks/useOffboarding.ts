'use client'

import { FormEvent, useMemo, useState } from 'react'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { useAuthStore } from '@/store/useAuthStore'
import { useToast } from '@/components/ui/ToastProvider'
import type { OffboardingProcess, OffboardingTask } from '@/services/offboarding/types'
import {
  fetchOffboardingEmployees,
  fetchOffboardingProcesses,
  initiateOffboarding,
  updateOffboardingTaskStatus,
  type OffboardingEmployeeOption,
  type OffboardingInitiatePayload,
} from '@/services/offboarding/api'

export interface UseOffboardingProps {
  initialProcesses: OffboardingProcess[]
  initialEmployees: OffboardingEmployeeOption[]
  initialCanManage: boolean
}

export function useOffboarding({ initialProcesses, initialEmployees, initialCanManage }: UseOffboardingProps) {
  const { user, token } = useAuthStore()
  const { showToast } = useToast()
  const queryClient = useQueryClient()

  const [form, setForm] = useState({ employeeId: '', exitDate: '', reason: '', notes: '' })
  const [errors, setErrors] = useState<{ employeeId?: string; exitDate?: string }>({})

  const canManageFromStore = useMemo(() => user?.permissions?.includes('offboarding.manage') ?? false, [user?.permissions])
  const canManage = canManageFromStore || initialCanManage

  const processesQuery = useQuery<OffboardingProcess[]>({
    queryKey: ['offboarding', 'processes'],
    queryFn: () => fetchOffboardingProcesses(),
    initialData: initialProcesses,
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  })

  const employeesQuery = useQuery<OffboardingEmployeeOption[]>({
    queryKey: ['offboarding', 'employees'],
    queryFn: () => fetchOffboardingEmployees(),
    initialData: initialEmployees,
    enabled: !!token,
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  })

  const initiateMutation = useMutation({
    mutationFn: (payload: OffboardingInitiatePayload) => initiateOffboarding(payload),
    onSuccess: () => {
      showToast('Offboarding process started', 'success')
      setForm({ employeeId: '', exitDate: '', reason: '', notes: '' })
      setErrors({})
      queryClient.invalidateQueries({ queryKey: ['offboarding', 'processes'] })
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || error?.message || 'Failed to initiate offboarding'
      showToast(message, 'error')
    },
  })

  const updateTaskMutation = useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: OffboardingTask['status'] }) =>
      updateOffboardingTaskStatus(taskId, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offboarding', 'processes'] })
      showToast('Task updated', 'success')
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || error?.message || 'Failed to update task'
      showToast(message, 'error')
    },
  })

  const handleInitiate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextErrors: { employeeId?: string; exitDate?: string } = {}
    if (!form.employeeId) nextErrors.employeeId = 'Employee is required'
    if (!form.exitDate) nextErrors.exitDate = 'Exit date is required'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return

    await initiateMutation.mutateAsync(form)
  }

  const handleTaskUpdate = async (taskId: string, status: OffboardingTask['status']) => {
    await updateTaskMutation.mutateAsync({ taskId, status })
  }

  return {
    canManage,
    form,
    setForm,
    errors,
    setErrors,
    processes: processesQuery.data ?? [],
    employees: employeesQuery.data ?? [],
    isLoading: processesQuery.isLoading,
    isSubmitting: initiateMutation.isPending,
    handleInitiate,
    handleTaskUpdate,
  }
}
