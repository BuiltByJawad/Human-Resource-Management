import api from '@/lib/axios'
import type { AttendanceRecord, ClockInPayload, ClockOutPayload } from '@/features/attendance/types/attendance.types'

const withAuthConfig = (token?: string) => (token ? { headers: { Authorization: `Bearer ${token}` } } : undefined)

const extractStatusCode = (error: unknown): number | undefined => {
  if (typeof error !== 'object' || error === null) {
    return undefined
  }
  const maybeResponse = (error as { response?: { status?: number } }).response
  return maybeResponse?.status
}

export async function fetchAttendanceRecords(token?: string, limit = 30): Promise<AttendanceRecord[]> {
  try {
    const response = await api.get('/attendance', {
      params: { limit },
      ...withAuthConfig(token),
    })

    const payload = response.data?.data ?? response.data
    const root = Array.isArray(payload)
      ? payload
      : Array.isArray((payload as { items?: unknown }).items)
        ? (payload as { items: unknown[] }).items
        : []

    return Array.isArray(root) ? (root as AttendanceRecord[]) : []
  } catch (error: unknown) {
    const status = extractStatusCode(error)
    if (status === 401 || status === 404) return []
    throw error
  }
}

export async function clockIn(payload: ClockInPayload, token?: string): Promise<AttendanceRecord> {
  const response = await api.post('/attendance/check-in', payload, withAuthConfig(token))
  const data = response.data?.data ?? response.data
  return data as AttendanceRecord
}

export async function clockOut(payload: ClockOutPayload, token?: string): Promise<AttendanceRecord> {
  const { attendanceId: _attendanceId, ...locationData } = payload
  const response = await api.post('/attendance/check-out', locationData, withAuthConfig(token))
  const data = response.data?.data ?? response.data
  return data as AttendanceRecord
}
