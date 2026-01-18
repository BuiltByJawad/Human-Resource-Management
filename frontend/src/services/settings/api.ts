import api from '@/lib/axios'
import type {
  ChangePasswordPayload,
  OrgSettingsFormState,
  OrgSettingsPayload,
  OrgSettingsUpdateResponse,
} from '@/services/settings/types'

export const updateOrgSettings = async (payload: OrgSettingsFormState): Promise<OrgSettingsPayload> => {
  const response = await api.put<OrgSettingsUpdateResponse>('/org/settings', payload)
  return response.data?.data ?? payload
}

export const uploadOrgLogo = async (file: File): Promise<string | null> => {
  const formData = new FormData()
  formData.append('logo', file)

  const response = await api.post<{ data?: { logoUrl?: string }; logoUrl?: string }>(
    '/org/branding/logo',
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
    },
  )

  return response.data?.data?.logoUrl ?? response.data?.logoUrl ?? null
}

export const uploadOrgFavicon = async (file: File): Promise<string | null> => {
  const formData = new FormData()
  formData.append('favicon', file)

  const response = await api.post<{ data?: { faviconUrl?: string }; faviconUrl?: string }>(
    '/org/branding/favicon',
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
