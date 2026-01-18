import api from '@/lib/axios'
import type { ExpenseClaim, SubmitExpenseClaimPayload, UpdateExpenseStatusPayload } from './types'

const buildApiBase = () =>
  process.env.BACKEND_URL ||
  (process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api$/, '') : null) ||
  'http://localhost:5000'

const fetchWithToken = async <T>(path: string, token: string | null): Promise<T | null> => {
  if (!token) return null
  try {
    const response = await fetch(`${buildApiBase()}${path}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    })

    if (!response.ok) return null
    const payload = (await response.json().catch(() => null)) as { data?: T } | T | null
    if (!payload) return null
    return (payload as { data?: T }).data ?? (payload as T)
  } catch {
    return null
  }
}

const withAuthConfig = (token?: string) =>
  token ? { headers: { Authorization: `Bearer ${token}` } } : undefined

const normalizeExpenseClaims = (payload: unknown): ExpenseClaim[] => {
  if (Array.isArray(payload)) return payload as ExpenseClaim[]
  const root = (payload as { expenses?: unknown[] })?.expenses
  return Array.isArray(root) ? (root as ExpenseClaim[]) : []
}

export const submitExpenseClaim = async (
  payload: SubmitExpenseClaimPayload,
  token?: string
): Promise<ExpenseClaim> => {
  const response = await api.post('/expenses', payload, withAuthConfig(token))
  const data = response.data?.data ?? response.data
  return data as ExpenseClaim
}

export const fetchMyExpenses = async (employeeId: string, token?: string): Promise<ExpenseClaim[]> => {
  if (!employeeId) return []
  const response = await api.get(`/expenses/my/${employeeId}`, withAuthConfig(token))
  const payload = response.data?.data ?? response.data
  return normalizeExpenseClaims(payload)
}

export const fetchPendingExpenses = async (token?: string): Promise<ExpenseClaim[]> => {
  const response = await api.get('/expenses/pending', withAuthConfig(token))
  const payload = response.data?.data ?? response.data
  return normalizeExpenseClaims(payload)
}

export const updateExpenseStatus = async (
  expenseId: string,
  payload: UpdateExpenseStatusPayload,
  token?: string
): Promise<ExpenseClaim> => {
  const response = await api.patch(`/expenses/${expenseId}/status`, payload, withAuthConfig(token))
  const data = response.data?.data ?? response.data
  return data as ExpenseClaim
}

export const fetchMyExpensesServer = async (
  employeeId: string | null,
  token: string | null
): Promise<ExpenseClaim[]> => {
  if (!employeeId) return []
  const payload = await fetchWithToken<ExpenseClaim[] | { expenses?: ExpenseClaim[] }>(
    `/api/expenses/my/${employeeId}`,
    token
  )
  if (!payload) return []
  return normalizeExpenseClaims(payload)
}

export const fetchPendingExpensesServer = async (token: string | null): Promise<ExpenseClaim[]> => {
  const payload = await fetchWithToken<ExpenseClaim[] | { expenses?: ExpenseClaim[] }>(
    '/api/expenses/pending',
    token
  )
  if (!payload) return []
  return normalizeExpenseClaims(payload)
}
