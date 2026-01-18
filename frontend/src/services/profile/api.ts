import api from '@/lib/axios'
import type { ProfileUpdateResponse, UpdateProfilePayload } from '@/services/profile/types'

const normalizeProfileResponse = (payload: unknown): ProfileUpdateResponse | null => {
  if (!payload || typeof payload !== 'object') return null
  const data = payload as { user?: Record<string, unknown>; employee?: Record<string, unknown> }
  if (data.user || data.employee) return { user: data.user, employee: data.employee }
  return { user: data as Record<string, unknown> }
}

export const uploadProfileAvatar = async (formData: FormData): Promise<string | null> => {
  const response = await api.post('/auth/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  const payload = response.data?.data ?? response.data
  if (!payload || typeof payload !== 'object') return null
  const data = payload as { avatarUrl?: string | null }
  return data.avatarUrl ?? null
}

export const fetchProfile = async (): Promise<ProfileUpdateResponse | null> => {
  const response = await api.get('/auth/profile')
  const payload = response.data?.data ?? response.data
  return normalizeProfileResponse(payload)
}

export const updateProfile = async (payload: UpdateProfilePayload): Promise<ProfileUpdateResponse> => {
  const response = await api.put('/auth/profile', payload)
  const data = response.data?.data ?? response.data
  return normalizeProfileResponse(data) ?? {}
}
