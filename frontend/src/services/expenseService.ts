import api from '@/lib/axios'
import type { ExpenseClaim as ExpenseClaimBase } from '@/types/hrm'

export type ExpenseClaim = ExpenseClaimBase

export const submitExpenseClaim = async (payload: {
  employeeId: string
  amount: number
  currency?: string
  category: string
  date: string
  description?: string
  receiptUrl?: string
}) => {
  const res = await api.post('/expenses', payload)
  return res.data.data || res.data
}

export const getMyExpenses = async (employeeId: string): Promise<ExpenseClaim[]> => {
  const res = await api.get(`/expenses/my/${employeeId}`)
  return res.data.data || res.data
}

export const getPendingExpenses = async (): Promise<ExpenseClaim[]> => {
  const res = await api.get('/expenses/pending')
  return res.data.data || res.data
}

export const updateExpenseStatus = async (
  id: string,
  payload: { status: 'approved' | 'rejected' | 'reimbursed'; rejectionReason?: string }
) => {
  const res = await api.patch(`/expenses/${id}/status`, payload)
  return res.data.data || res.data
}
