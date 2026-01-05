import api from '@/lib/axios'
import type {
  OrgSettings,
  UpdateOrgSettingsPayload,
  ChangePasswordPayload,
} from '@/features/settings/types/settings.types'

const withAuthConfig = (token?: string) => (token ? { headers: { Authorization: `Bearer ${token}` } } : undefined)

const unwrap = <T>(res: any): T => res?.data?.data ?? res?.data ?? res

export async function getOrgSettings(token?: string): Promise<OrgSettings> {
  const res = await api.get('/org/settings', withAuthConfig(token))
  return unwrap<OrgSettings>(res)
}

export async function updateOrgSettings(payload: UpdateOrgSettingsPayload, token?: string): Promise<OrgSettings> {
  const res = await api.put('/org/settings', payload, withAuthConfig(token))
  return unwrap<OrgSettings>(res)
}

export async function uploadLogo(file: File, token?: string): Promise<{ logoUrl: string }> {
  const formData = new FormData()
  formData.append('logo', file)

  const res = await api.post('/org/branding/logo', formData, {
    headers: { 'Content-Type': 'multipart/form-data', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  })
  const url = res?.data?.data?.logoUrl || res?.data?.logoUrl
  return { logoUrl: url }
}

export async function uploadFavicon(file: File, token?: string): Promise<{ faviconUrl: string }> {
  const formData = new FormData()
  formData.append('favicon', file)

  const res = await api.post('/org/branding/favicon', formData, {
    headers: { 'Content-Type': 'multipart/form-data', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  })
  const url = res?.data?.data?.faviconUrl || res?.data?.faviconUrl
  return { faviconUrl: url }
}

export async function deleteFavicon(token?: string): Promise<void> {
  await api.delete('/org/branding/favicon', withAuthConfig(token))
}

export async function changePassword(payload: ChangePasswordPayload, token?: string): Promise<void> {
  await api.post('/auth/password/change', payload, withAuthConfig(token))
}
