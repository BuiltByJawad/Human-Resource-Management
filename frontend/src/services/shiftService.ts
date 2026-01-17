import api from '@/lib/axios'
import type { Shift } from '@/services/shifts/types'

export const shiftService = {
  getShifts: async (startDate: string, endDate: string) => {
    const response = await api.get<{ data: Shift[] }>(`/shifts?startDate=${startDate}&endDate=${endDate}`)
    return Array.isArray(response.data?.data) ? response.data.data : []
  },

  requestSwap: async (shiftId: string, reason?: string, targetId?: string) => {
    const response = await api.post('/shifts/swap', { shiftId, reason, targetId })
    return response.data
  },

  // Admin/Manager functions
  scheduleShift: async (data: any) => {
    const response = await api.post('/shifts', data)
    return response.data
  }
}
