import api from '@/lib/axios'
import type { ScheduleShiftPayload, Shift } from '@/features/shifts/types/shifts.types'

const withAuthConfig = (token?: string) => (token ? { headers: { Authorization: `Bearer ${token}` } } : undefined)
const unwrap = <T>(res: any): T => res?.data?.data ?? res?.data ?? res

export async function getShifts(startDate: string, endDate: string, token?: string): Promise<Shift[]> {
  const res = await api.get(`/shifts?startDate=${startDate}&endDate=${endDate}`, withAuthConfig(token))
  return unwrap<Shift[]>(res) ?? []
}

export async function requestSwap(shiftId: string, reason?: string, targetId?: string, token?: string): Promise<Shift> {
  const res = await api.post('/shifts/swap', { shiftId, reason, targetId }, withAuthConfig(token))
  return unwrap<Shift>(res)
}

export async function scheduleShift(payload: ScheduleShiftPayload, token?: string): Promise<Shift> {
  const res = await api.post('/shifts', payload, withAuthConfig(token))
  return unwrap<Shift>(res)
}
