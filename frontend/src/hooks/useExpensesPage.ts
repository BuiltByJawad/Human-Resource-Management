'use client'

import { useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'

import { useToast } from '@/components/ui/ToastProvider'
import { handleCrudError } from '@/lib/apiError'
import { fetchMyExpenses, submitExpenseClaim } from '@/services/expenses/api'
import type { ExpenseClaim, SubmitExpenseClaimPayload } from '@/services/expenses/types'

const defaultFormState: SubmitExpenseClaimPayload = {
  employeeId: '',
  amount: 0,
  currency: 'USD',
  category: 'Travel',
  date: format(new Date(), 'yyyy-MM-dd'),
  description: '',
  receiptUrl: '',
}

interface UseExpensesPageParams {
  employeeId: string | null
  initialClaims: ExpenseClaim[]
}

export const useExpensesPage = ({ employeeId, initialClaims }: UseExpensesPageParams) => {
  const { showToast } = useToast()
  const queryClient = useQueryClient()
  const [form, setForm] = useState<SubmitExpenseClaimPayload>(() => ({
    ...defaultFormState,
    employeeId: employeeId ?? '',
  }))

  const claimsQuery = useQuery({
    queryKey: ['expenses', employeeId],
    queryFn: () => fetchMyExpenses(employeeId as string),
    enabled: !!employeeId,
    retry: false,
    initialData: employeeId ? initialClaims : [],
  })

  useMemo(() => {
    if (claimsQuery.isError && claimsQuery.error) {
      handleCrudError({
        error: claimsQuery.error,
        resourceLabel: 'Expenses',
        showToast,
      })
    }
  }, [claimsQuery.isError, claimsQuery.error, showToast])

  const resetForm = () =>
    setForm({
      ...defaultFormState,
      employeeId: employeeId ?? '',
    })

  const handleSubmit = async (payload: SubmitExpenseClaimPayload) => {
    if (!employeeId) {
      showToast('Employee profile missing', 'error')
      return
    }

    try {
      await submitExpenseClaim({ ...payload, employeeId })
      showToast('Expense submitted', 'success')
      resetForm()
      queryClient.invalidateQueries({ queryKey: ['expenses', employeeId] })
    } catch (error: unknown) {
      handleCrudError({
        error,
        resourceLabel: 'Expense claim',
        showToast,
      })
    }
  }

  return {
    form,
    setForm,
    claimsQuery,
    handleSubmit,
    resetForm,
  }
}
