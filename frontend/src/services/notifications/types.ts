import { PERMISSIONS } from '@/constants/permissions'

export type NotificationCategory =
  | 'payroll'
  | 'leave'
  | 'compliance'
  | 'recruitment'
  | 'expense'
  | 'performance'
  | 'general'

export type NotificationSeverity = 'low' | 'medium' | 'high'

export interface RawNotification {
  id?: string
  title?: string
  message?: string
  createdAt?: string
  readAt?: string | null
  read?: boolean
  isRead?: boolean
  link?: string
}

export interface NotificationItem {
  id: string
  title: string
  message: string
  time: string
  read: boolean
  link?: string
  category: NotificationCategory
  categoryLabel: string
  categoryColorClass: string
  severity: NotificationSeverity
  requiresPermission?: (typeof PERMISSIONS)[keyof typeof PERMISSIONS]
}

export interface NotificationsResponse {
  data?: unknown
  unreadCount?: number
  unread?: number
  unread_count?: number
  totalUnread?: number
  unreadTotal?: number
  notifications?: RawNotification[]
  items?: RawNotification[]
  docs?: RawNotification[]
  results?: RawNotification[]
}
