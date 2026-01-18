import api from '@/lib/axios'
import type { Shift, ShiftFormState } from '@/services/shifts/types'

export const fetchShifts = async (startDate: string, endDate: string): Promise<Shift[]> => {
  const response = await api.get<{ data: Shift[] }>(`/shifts?startDate=${startDate}&endDate=${endDate}`)
  return Array.isArray(response.data?.data) ? response.data.data : []
}

export const createShift = async (payload: ShiftFormState): Promise<void> => {
  await api.post('/shifts', {
    employeeId: payload.employeeId,
    startTime: new Date(payload.startTime).toISOString(),
    endTime: new Date(payload.endTime).toISOString(),
    type: payload.type,
    location: payload.location || undefined,
  })
}

export const requestShiftSwap = async (
  shiftId: string,
  reason?: string,
  targetId?: string,
): Promise<void> => {
  await api.post('/shifts/swap', { shiftId, reason, targetId })
}
