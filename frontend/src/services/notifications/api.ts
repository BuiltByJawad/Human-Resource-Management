import api from '@/lib/axios'
import { NotificationsResponse } from './types'

const headersFor = (token?: string | null): Record<string, string> => {
  const headers: Record<string, string> = {
    'Cache-Control': 'no-store',
  }

  if (token) headers.Authorization = `Bearer ${token}`

  return headers
}

export const fetchNotifications = async (token?: string | null): Promise<NotificationsResponse> => {
  const headers = headersFor(token)

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

export const markAllNotificationsRead = async (token?: string | null) => {
  const headers = headersFor(token)

  const res = await fetch('/api/notifications/mark-all-read', {
    method: 'POST',
    credentials: 'include',
    cache: 'no-store',
    headers,
  })

  if (!res.ok) {
    const error: any = new Error('Failed to update notifications')
    error.status = res.status
    error.body = await res.text().catch(() => null)
    throw error
  }

  return res.json().catch(() => null)
}

export const markNotificationRead = async (id: string, token?: string | null) => {
  const headers = headersFor(token)

  const res = await fetch(`/api/notifications/${id}/read`, {
    method: 'PATCH',
    credentials: 'include',
    cache: 'no-store',
    headers,
  })

  if (!res.ok) {
    const error: any = new Error('Failed to update notification')
    error.status = res.status
    error.body = await res.text().catch(() => null)
    throw error
  }

  return res.json().catch(() => null)
}
