import api from '@/lib/axios'
import type {
  ChangePasswordPayload,
  BrandingSettingsPayload,
  BrandingSettingsUpdateResponse,
  PolicyHistoryEntry,
  StartMfaEnrollmentResponse,
} from '@/services/settings/types'

export const updateBrandingSettings = async (
  payload: BrandingSettingsPayload
): Promise<BrandingSettingsPayload> => {
  const response = await api.put<BrandingSettingsUpdateResponse>('/settings', payload)
  return response.data?.data ?? payload
}

export const uploadBrandingLogo = async (file: File): Promise<string | null> => {
  const formData = new FormData()
  formData.append('logo', file)

  const response = await api.post<{ data?: { logoUrl?: string }; logoUrl?: string }>(
    '/settings/branding/logo',
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
    },
  )

  return response.data?.data?.logoUrl ?? response.data?.logoUrl ?? null
}

export const uploadBrandingFavicon = async (file: File): Promise<string | null> => {
  const formData = new FormData()
  formData.append('favicon', file)

  const response = await api.post<{ data?: { faviconUrl?: string }; faviconUrl?: string }>(
    '/settings/branding/favicon',
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
    },
  )

  return response.data?.data?.faviconUrl ?? response.data?.faviconUrl ?? null
}

export const changePassword = async (payload: ChangePasswordPayload): Promise<void> => {
  await api.post('/auth/password/change', payload)
}

export const fetchPolicyHistory = async (): Promise<PolicyHistoryEntry[]> => {
  const response = await api.get<{ success?: boolean; data?: PolicyHistoryEntry[] }>('/settings/policies/history')
  return response.data?.data ?? []
}

export const startMfaEnrollment = async (): Promise<StartMfaEnrollmentResponse> => {
  const response = await api.post<{ success?: boolean; data?: StartMfaEnrollmentResponse }>(
    '/auth/mfa/enroll/start',
  )

  const payload = response.data?.data
  if (!payload || !payload.otpauthUrl || !payload.enrollmentToken) {
    throw new Error('Failed to start MFA enrollment')
  }

  return payload
}

export const confirmMfaEnrollment = async (params: {
  code: string
  enrollmentToken: string
}): Promise<void> => {
  await api.post('/auth/mfa/enroll/confirm', {
    code: params.code,
    enrollmentToken: params.enrollmentToken,
  })
}

export const disableMfa = async (): Promise<void> => {
  await api.post('/auth/mfa/disable')
}
