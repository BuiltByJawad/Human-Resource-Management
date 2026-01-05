import { getClientTenantSlug } from '@/lib/tenant'
import api from '@/lib/axios'
import type {
  CurrentUser,
  LoginPayload,
  LoginResponse,
  RefreshPayload,
  RefreshResponse,
} from '@/features/auth/types/auth.types'

const BASE_OPTIONS: RequestInit = {
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include',
}

export async function loginRequest(payload: LoginPayload): Promise<LoginResponse> {
  const tenantSlug = getClientTenantSlug()
  const response = await fetch('/api/auth/login', {
    ...BASE_OPTIONS,
    method: 'POST',
    headers: {
      ...BASE_OPTIONS.headers,
      ...(tenantSlug ? { 'X-Tenant-Slug': tenantSlug } : {}),
    },
    body: JSON.stringify(payload),
  })

  const json = await response.json().catch(() => null)
  if (!response.ok) {
    const message = json?.error || json?.message || 'Login failed'
    throw new Error(message)
  }

  const data = json?.data ?? json
  return data as LoginResponse
}

export async function refreshSessionRequest(payload: RefreshPayload): Promise<RefreshResponse> {
  const tenantSlug = getClientTenantSlug()
  const response = await fetch('/api/auth/refresh', {
    ...BASE_OPTIONS,
    method: 'POST',
    headers: {
      ...BASE_OPTIONS.headers,
      ...(tenantSlug ? { 'X-Tenant-Slug': tenantSlug } : {}),
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    return { ok: false }
  }

  const json = await response.json().catch(() => null)
  const data = json?.data ?? json
  return { ok: true, data: data as LoginResponse }
}

export async function logoutRequest(): Promise<void> {
  await fetch('/api/auth/logout', {
    ...BASE_OPTIONS,
    method: 'GET',
  }).catch(() => undefined)
}

const withAuthConfig = (token?: string) => (token ? { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' as const } : { cache: 'no-store' as const })

export async function fetchCurrentUser(token?: string): Promise<CurrentUser | null> {
  if (!token) return null
  const response = await api.get('/auth/me', withAuthConfig(token))
  const payload = response.data?.data ?? response.data
  if (!payload) return null
  const user = (payload as { user?: CurrentUser }).user ?? (payload as CurrentUser | null)
  return user ?? null
}

export async function fetchProfile(token?: string): Promise<CurrentUser | null> {
  if (!token) return null
  const response = await api.get('/auth/profile', withAuthConfig(token))
  const payload = response.data?.data ?? response.data
  const user = (payload as { user?: CurrentUser }).user ?? (payload as CurrentUser | null)
  return user ?? null
}

export async function updateProfile(payload: any, token?: string): Promise<{ user?: CurrentUser; employee?: any }> {
  const response = await api.put('/auth/profile', payload, withAuthConfig(token))
  return response.data?.data ?? response.data
}

export async function uploadAvatar(file: File, token?: string): Promise<{ avatarUrl?: string }> {
  const formData = new FormData()
  formData.append('avatar', file)

  const envApiUrl = process.env.NEXT_PUBLIC_API_URL
  const resolvedBaseUrl =
    envApiUrl && /^https?:\/\//i.test(envApiUrl)
      ? envApiUrl
      : String((api as any)?.defaults?.baseURL || 'http://localhost:5000/api')
  const baseUrl = resolvedBaseUrl.replace(/\/$/, '')
  const endpoint = `${baseUrl}/auth/avatar`

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  })

  if (!response.ok) {
    const payload = await response.json().catch(() => null)
    const message = payload?.error?.message || payload?.message || 'Failed to upload avatar'
    throw new Error(message)
  }

  const uploadPayload = await response.json().catch(() => null)
  const avatarUrl = uploadPayload?.data?.avatarUrl || uploadPayload?.avatarUrl || null
  return { avatarUrl }
}
