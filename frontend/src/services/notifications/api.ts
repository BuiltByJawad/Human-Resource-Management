import api from '@/lib/axios'
import { NotificationsResponse } from './types'

const headersFor = (token?: string | null, tenantSlug?: string | null): Record<string, string> => {
  const headers: Record<string, string> = {
    'Cache-Control': 'no-store',
  }

  if (token) headers.Authorization = `Bearer ${token}`
  if (tenantSlug) headers['X-Tenant-Slug'] = tenantSlug

  return headers
}

export const fetchNotifications = async (token?: string | null, tenantSlug?: string | null): Promise<NotificationsResponse> => {
  const headers = headersFor(token, tenantSlug)

  const res = await fetch('/api/notifications', {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store',
    headers,
  })

  const text = await res.text()
  const parsed = text ? (JSON.parse(text) as unknown) : null

  if (!res.ok) {
    const error: any = new Error('Failed to load notifications')
    error.status = res.status
    error.body = parsed
    throw error
  }

  return (parsed as NotificationsResponse) || {}
}

export const markAllNotificationsRead = (token?: string | null, tenantSlug?: string | null) =>
  api.post('/notifications/mark-all-read', undefined, { headers: headersFor(token, tenantSlug) })

export const markNotificationRead = (id: string, token?: string | null, tenantSlug?: string | null) =>
  api.patch(`/notifications/${id}/read`, undefined, { headers: headersFor(token, tenantSlug) })
