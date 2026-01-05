import api from '@/lib/axios'
import type {
  CreateLeavePayload,
  LeaveFilterParams,
  LeaveRequest,
} from '@/features/leave/types/leave.types'

const withAuthConfig = (token?: string) => (token ? { headers: { Authorization: `Bearer ${token}` } } : undefined)

const extractStatusCode = (error: unknown): number | undefined => {
  if (typeof error !== 'object' || error === null) return undefined
  const maybeResponse = (error as { response?: { status?: number } }).response
  return maybeResponse?.status
}

export async function fetchLeaveRequests(
  params: LeaveFilterParams,
  token?: string,
): Promise<LeaveRequest[]> {
  const query: Record<string, string> = {}
  if (params.status && params.status !== 'all') query.status = params.status

  try {
    const response = await api.get('/leave', {
      params: query,
      ...withAuthConfig(token),
    })
    const payload = response.data?.data ?? response.data
    return Array.isArray(payload) ? (payload as LeaveRequest[]) : []
  } catch (error: unknown) {
    const status = extractStatusCode(error)
    if (status === 401 || status === 404) return []
    throw error
  }
}

export async function createLeaveRequest(
  payload: CreateLeavePayload,
  token?: string,
): Promise<LeaveRequest> {
  const response = await api.post('/leave', payload, withAuthConfig(token))
  const data = response.data?.data ?? response.data
  return data as LeaveRequest
}

export async function approveLeave(leaveId: string, token?: string): Promise<LeaveRequest> {
  const response = await api.put(`/leave/${leaveId}/approve`, undefined, withAuthConfig(token))
  const data = response.data?.data ?? response.data
  return data as LeaveRequest
}

export async function rejectLeave(leaveId: string, token?: string): Promise<LeaveRequest> {
  const response = await api.put(`/leave/${leaveId}/reject`, undefined, withAuthConfig(token))
  const data = response.data?.data ?? response.data
  return data as LeaveRequest
}

export async function cancelLeave(leaveId: string, token?: string): Promise<LeaveRequest> {
  const response = await api.put(`/leave/${leaveId}/cancel`, undefined, withAuthConfig(token))
  const data = response.data?.data ?? response.data
  return data as LeaveRequest
}
