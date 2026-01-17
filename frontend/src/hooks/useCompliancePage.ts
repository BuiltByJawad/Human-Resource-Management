'use client'

import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/useAuthStore'
import { useToast } from '@/components/ui/ToastProvider'
import { handleCrudError } from '@/lib/apiError'
import type { ComplianceLog, ComplianceRule } from '@/services/compliance/types'
import {
  createComplianceRule,
  fetchComplianceLogs,
  fetchComplianceRules,
  runComplianceCheck,
  toggleComplianceRule,
} from '@/services/compliance/api'

export type RuleFormField = 'name' | 'description' | 'type' | 'threshold'
export type RuleFormErrors = Partial<Record<RuleFormField, string>>

interface UseCompliancePageOptions {
  initialRules: ComplianceRule[]
  initialLogs: ComplianceLog[]
}

export function useCompliancePage({ initialRules, initialLogs }: UseCompliancePageOptions) {
  const { token } = useAuthStore()
  const { showToast } = useToast()
  const queryClient = useQueryClient()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formErrors, setFormErrors] = useState<RuleFormErrors>({})

  const rulesQuery = useQuery<ComplianceRule[]>({
    queryKey: ['compliance', 'rules', token],
    queryFn: () => fetchComplianceRules(token ?? undefined),
    enabled: !!token,
    retry: false,
    initialData: initialRules,
  })

  const logsQuery = useQuery<ComplianceLog[]>({
    queryKey: ['compliance', 'logs', token],
    queryFn: () => fetchComplianceLogs(token ?? undefined),
    enabled: !!token,
    retry: false,
    initialData: initialLogs,
  })

  useEffect(() => {
    if (rulesQuery.isError && rulesQuery.error) {
      handleCrudError({
        error: rulesQuery.error,
        resourceLabel: 'Compliance rules',
        showToast,
      })
    }
  }, [rulesQuery.isError, rulesQuery.error, showToast])

  useEffect(() => {
    if (logsQuery.isError && logsQuery.error) {
      handleCrudError({
        error: logsQuery.error,
        resourceLabel: 'Compliance logs',
        showToast,
      })
    }
  }, [logsQuery.isError, logsQuery.error, showToast])

  const createRuleMutation = useMutation({
    mutationFn: (data: Partial<ComplianceRule>) => createComplianceRule(data, token ?? undefined),
    onSuccess: () => {
      showToast('Rule created successfully', 'success')
      setFormErrors({})
      setIsModalOpen(false)
      queryClient.invalidateQueries({ queryKey: ['compliance', 'rules'] })
    },
    onError: (error: unknown) =>
      handleCrudError({
        error,
        resourceLabel: 'Compliance rule',
        showToast,
        setFieldError: (field, message) => {
          setFormErrors((prev) => ({ ...prev, [field as RuleFormField]: message }))
        },
        defaultField: 'name',
        onUnauthorized: () => console.warn('Not authorized to manage compliance rules'),
      }),
  })

  const toggleRuleMutation = useMutation({
    mutationFn: (id: string) => toggleComplianceRule(id, token ?? undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compliance', 'rules'] })
    },
    onError: (error: unknown) =>
      handleCrudError({
        error,
        resourceLabel: 'Compliance rule',
        showToast,
      }),
  })

  const runCheckMutation = useMutation({
    mutationFn: () => runComplianceCheck(token ?? undefined),
    onSuccess: (result) => {
      showToast(result?.message || 'Compliance check completed', 'success')
      queryClient.invalidateQueries({ queryKey: ['compliance', 'logs'] })
    },
    onError: (error: unknown) =>
      handleCrudError({
        error,
        resourceLabel: 'Compliance check',
        showToast,
      }),
  })

  const handleCreateRule = async (data: Partial<ComplianceRule>) => {
    await createRuleMutation.mutateAsync(data)
  }

  const handleToggleRule = (id: string) => toggleRuleMutation.mutate(id)

  const handleRunCheck = () => runCheckMutation.mutate()

  return {
    rules: rulesQuery.data ?? [],
    logs: logsQuery.data ?? [],
    isLoadingRules: rulesQuery.isLoading,
    isLoadingLogs: logsQuery.isLoading,
    isModalOpen,
    setIsModalOpen,
    formErrors,
    setFormErrors,
    handleCreateRule,
    handleToggleRule,
    handleRunCheck,
    actionLoading: createRuleMutation.isPending || toggleRuleMutation.isPending || runCheckMutation.isPending,
  }
}
