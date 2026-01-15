import api from '@/lib/axios'
import { NotificationsResponse } from './types'

export const fetchNotifications = async (token?: string | null, tenantSlug?: string | null): Promise<NotificationsResponse> => {
  const headers: Record<string, string> = {
    'Cache-Control': 'no-store',
  }

  if (token) headers.Authorization = `Bearer ${token}`
  if (tenantSlug) headers['X-Tenant-Slug'] = tenantSlug

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

export const markAllNotificationsRead = () => api.post('/notifications/mark-all-read')

export const markNotificationRead = (id: string) => api.patch(`/notifications/${id}/read`)
