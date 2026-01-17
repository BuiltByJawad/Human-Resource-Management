import api from '@/lib/axios'
import type { RawNotification } from '@/services/notifications/types'

export const notificationService = {
  getNotifications: async () => {
    try {
      const response = await api.get<{ data: RawNotification[] }>('/notifications')
      return Array.isArray(response.data?.data) ? response.data.data : []
    } catch {
      return []
    }
  },

  markAsRead: async (notificationId: string) => {
    const response = await api.patch(`/notifications/${notificationId}/read`)
    return response.data
  },

  markAllAsRead: async () => {
    const response = await api.post('/notifications/mark-all-read')
    return response.data
  },

  createNotification: async (data: {
    userId: string
    title: string
    message?: string
    type?: string
    link?: string
  }) => {
    const response = await api.post('/notifications', data)
    return response.data
  },
}
