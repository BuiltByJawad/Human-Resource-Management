'use client'

import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getClientTenantSlug } from '@/lib/tenant'
import { readTenantUnreadCount, writeTenantUnreadCount } from '@/lib/utils/notificationStorage'
import { mapNotificationPayload } from '@/lib/utils/notifications'
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/services/notifications/api'
import { NotificationItem, NotificationsResponse, RawNotification } from '@/services/notifications/types'

const extractUnreadCount = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value) && value >= 0) return value
  if (!value || typeof value !== 'object') return null
  const obj = value as Record<string, unknown>
  const direct = obj.unreadCount ?? obj.unread ?? obj.unread_count ?? obj.totalUnread ?? obj.unreadTotal
  if (typeof direct === 'number' && Number.isFinite(direct) && direct >= 0) return direct
  if (obj.data) {
    const nested = extractUnreadCount(obj.data)
    if (nested != null) return nested
  }
  return null
}

const extractArray = (value: unknown): RawNotification[] => {
  if (Array.isArray(value)) return value as RawNotification[]
  if (!value || typeof value !== 'object') return []
  const obj = value as Record<string, unknown>
  if (Array.isArray(obj.notifications)) return obj.notifications as RawNotification[]
  if (Array.isArray(obj.items)) return obj.items as RawNotification[]
  if (Array.isArray(obj.docs)) return obj.docs as RawNotification[]
  if (Array.isArray(obj.results)) return obj.results as RawNotification[]
  if (obj.data && typeof obj.data === 'object') {
    const nested = obj.data as Record<string, unknown>
    if (Array.isArray(nested.notifications)) return nested.notifications as RawNotification[]
    if (Array.isArray(nested.items)) return nested.items as RawNotification[]
    if (Array.isArray(nested.docs)) return nested.docs as RawNotification[]
    if (Array.isArray(nested.results)) return nested.results as RawNotification[]

    if (nested.data && typeof nested.data === 'object') {
      const nested2 = nested.data as Record<string, unknown>
      if (Array.isArray(nested2.notifications)) return nested2.notifications as RawNotification[]
      if (Array.isArray(nested2.items)) return nested2.items as RawNotification[]
      if (Array.isArray(nested2.docs)) return nested2.docs as RawNotification[]
      if (Array.isArray(nested2.results)) return nested2.results as RawNotification[]
    }
  }
  return []
}

export type UseNotificationsParams = {
  token: string | null
  isAuthenticated: boolean
  hasInitialAuth: boolean
  onMutationError?: (err: any, scope: 'all' | 'one') => void
}

export type UseNotificationsResult = {
  notifications: NotificationItem[]
  unreadCount: number
  isLoading: boolean
  error: string | null
  markAllRead: () => void
  markOneRead: (id: string) => void
}

export function useNotifications({ token, isAuthenticated, hasInitialAuth, onMutationError }: UseNotificationsParams): UseNotificationsResult {
  const [cachedUnreadCount, setCachedUnreadCount] = useState<number>(() => readTenantUnreadCount())
  const [serverUnreadCount, setServerUnreadCount] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const tenantSlug = typeof window !== 'undefined' ? getClientTenantSlug() ?? null : null
  const queryClient = useQueryClient()

  const notificationsQuery = useQuery<NotificationItem[]>({
    queryKey: ['notifications', token],
    enabled: Boolean(token) || isAuthenticated || hasInitialAuth,
    queryFn: async (): Promise<NotificationItem[]> => {
      try {
        const response = await fetchNotifications(token, tenantSlug)
        const payload = (response && typeof response === 'object' ? response : {}) as NotificationsResponse
        const root = (payload as { data?: unknown }).data ?? payload

        const maybeUnreadCount = extractUnreadCount(payload)
        if (maybeUnreadCount != null) {
          setServerUnreadCount(maybeUnreadCount)
          setCachedUnreadCount(maybeUnreadCount)
          writeTenantUnreadCount(maybeUnreadCount)
        }

        const rawItems = extractArray(root)
        if (rawItems.length > 0) {
          const unreadFromPayload = rawItems.filter((item) => {
            if (!item || typeof item !== 'object') return false
            const hasReadAt = Boolean((item as RawNotification).readAt)
            const isRead = (item as RawNotification).read === true || (item as RawNotification).isRead === true
            return !hasReadAt && !isRead
          }).length
          setServerUnreadCount(unreadFromPayload)
          setCachedUnreadCount(unreadFromPayload)
          writeTenantUnreadCount(unreadFromPayload)
        }

        setError(null)
        return rawItems.map(mapNotificationPayload)
      } catch (err: any) {
        const status = err?.status ?? err?.response?.status
        if (status === 403) {
          setError('You do not have permission to view notifications.')
        } else {
          setError('Failed to load notifications.')
        }
        throw err
      }
    },
    staleTime: 15_000,
    refetchInterval: isAuthenticated ? 30_000 : false,
    refetchIntervalInBackground: true,
    refetchOnMount: isAuthenticated ? 'always' : false,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  })

  const markAllReadMutation = useMutation({
    mutationFn: () => markAllNotificationsRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
    onError: (err) => onMutationError?.(err, 'all'),
  })

  const markReadMutation = useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
    onError: (err) => onMutationError?.(err, 'one'),
  })

  const notificationData = (notificationsQuery.data ?? []) as NotificationItem[]

  useEffect(() => {
    // if (!notificationsQuery.isSuccess && serverUnreadCount === null && notificationData.length === 0) return
    if (error) return
    const liveUnread = notificationData.filter((item) => !item.read).length
    const nextUnread = serverUnreadCount ?? liveUnread
    if (!Number.isFinite(nextUnread) || nextUnread < 0) return

    setServerUnreadCount((prev) => (prev === nextUnread ? prev : nextUnread))
    setCachedUnreadCount((prev) => (prev === nextUnread ? prev : nextUnread))
    writeTenantUnreadCount(nextUnread)
  }, [notificationsQuery.isSuccess, notificationData, serverUnreadCount, error])

  const unreadCount = useMemo(() => {
    if (error) return 0
    const liveUnread = notificationData.filter((item) => !item.read).length
    if (serverUnreadCount != null) return serverUnreadCount
    if (notificationData && notificationData.length > 0) return liveUnread
    return cachedUnreadCount
  }, [cachedUnreadCount, error, notificationData, serverUnreadCount])

  const markAllRead = () => {
    if (markAllReadMutation.isPending) return
    markAllReadMutation.mutate()
  }

  const markOneRead = (id: string) => {
    if (markReadMutation.isPending) return
    markReadMutation.mutate(id)
  }

  return {
    notifications: notificationData,
    unreadCount,
    isLoading: notificationsQuery.isLoading,
    error,
    markAllRead,
    markOneRead,
  }
}
