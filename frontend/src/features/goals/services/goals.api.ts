import api from '@/lib/axios'
import type { KeyResult, PerformanceGoal } from '@/features/goals/types/goals.types'

const withAuthConfig = (token?: string) => (token ? { headers: { Authorization: `Bearer ${token}` } } : undefined)
const unwrap = <T>(res: any): T => res?.data?.data ?? res?.data ?? res

export async function getMyGoals(token?: string): Promise<PerformanceGoal[]> {
  const res = await api.get('/goals/my-goals', withAuthConfig(token))
  return unwrap<PerformanceGoal[]>(res) ?? []
}

export async function createGoal(payload: Partial<PerformanceGoal>, token?: string): Promise<PerformanceGoal> {
  const res = await api.post('/goals', payload, withAuthConfig(token))
  return unwrap<PerformanceGoal>(res)
}

export async function addKeyResult(payload: Partial<KeyResult>, token?: string): Promise<KeyResult> {
  const res = await api.post('/goals/key-results', payload, withAuthConfig(token))
  return unwrap<KeyResult>(res)
}

export async function updateKeyResultProgress(id: string, currentValue: number, token?: string): Promise<KeyResult> {
  const res = await api.patch(`/goals/key-results/${id}`, { currentValue }, withAuthConfig(token))
  return unwrap<KeyResult>(res)
}
