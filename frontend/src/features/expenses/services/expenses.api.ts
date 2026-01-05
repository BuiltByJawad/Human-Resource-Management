import api from '@/lib/axios'
import type {
  ExpenseClaim,
  SubmitExpenseClaimPayload,
  UpdateExpenseStatusPayload,
} from '@/features/expenses/types/expenses.types'

const withAuthConfig = (token?: string) => (token ? { headers: { Authorization: `Bearer ${token}` } } : undefined)

export async function submitExpenseClaim(
  payload: SubmitExpenseClaimPayload,
  token?: string,
): Promise<ExpenseClaim> {
  const response = await api.post('/expenses', payload, withAuthConfig(token))
  const data = response.data?.data ?? response.data
  return data as ExpenseClaim
}

export async function getMyExpenses(employeeId: string, token?: string): Promise<ExpenseClaim[]> {
  if (!employeeId) return []
  const response = await api.get(`/expenses/my/${employeeId}`, withAuthConfig(token))
  const data = response.data?.data ?? response.data
  return Array.isArray(data) ? (data as ExpenseClaim[]) : []
}

export async function fetchPendingExpenses(token?: string): Promise<ExpenseClaim[]> {
  const response = await api.get('/expenses/pending', withAuthConfig(token))
  const data = response.data?.data ?? response.data
  return Array.isArray(data) ? (data as ExpenseClaim[]) : []
}

export async function updateExpenseStatus(
  expenseId: string,
  payload: UpdateExpenseStatusPayload,
  token?: string,
): Promise<ExpenseClaim> {
  const response = await api.patch(`/expenses/${expenseId}/status`, payload, withAuthConfig(token))
  const data = response.data?.data ?? response.data
  return data as ExpenseClaim
}
