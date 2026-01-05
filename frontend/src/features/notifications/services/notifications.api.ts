import api from '@/lib/axios'
import type { Notification } from '@/features/notifications/types/notifications.types'

const withAuthConfig = (token?: string) => (token ? { headers: { Authorization: `Bearer ${token}` } } : undefined)
const unwrap = <T>(res: any): T => res?.data?.data ?? res?.data ?? res

export async function getNotifications(token?: string): Promise<Notification[]> {
  const res = await api.get('/notifications', withAuthConfig(token))
  const data = unwrap<Notification[]>(res)
  return Array.isArray(data) ? data : []
}

export async function markNotificationAsRead(notificationId: string, token?: string): Promise<void> {
  await api.patch(`/notifications/${notificationId}/read`, undefined, withAuthConfig(token))
}

export async function markAllNotificationsAsRead(token?: string): Promise<void> {
  await api.post('/notifications/mark-all-read', undefined, withAuthConfig(token))
}

export async function createNotification(
  payload: { userId: string; title: string; message?: string; type?: string; link?: string },
  token?: string,
): Promise<Notification> {
  const res = await api.post('/notifications', payload, withAuthConfig(token))
  return unwrap<Notification>(res)
}
