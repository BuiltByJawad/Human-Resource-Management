
import api from '@/lib/axios'
import type { KeyResult, PerformanceGoal } from '@/services/goals/types'

export const goalsService = {
  getMyGoals: async () => {
    const response = await api.get<{ data: PerformanceGoal[] }>('/goals/my-goals')
    return Array.isArray(response.data?.data) ? response.data.data : []
  },

  createGoal: async (data: Partial<PerformanceGoal>) => {
    const response = await api.post('/goals', data)
    return response.data
  },

  addKeyResult: async (data: Partial<KeyResult>) => {
    const response = await api.post('/goals/key-results', data)
    return response.data
  },

  updateKeyResultProgress: async (id: string, currentValue: number) => {
    const response = await api.patch(`/goals/key-results/${id}`, { currentValue })
    return response.data
  }
}
