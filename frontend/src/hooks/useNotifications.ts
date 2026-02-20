'use client'

import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { io, type Socket } from 'socket.io-client'
import { getBackendBaseUrl } from '@/lib/config/env'
import { readUnreadCount, writeUnreadCount } from '@/lib/utils/notificationStorage'
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
  markOneRead: (id: string) => Promise<void>
}

export function useNotifications({ token, isAuthenticated, hasInitialAuth, onMutationError }: UseNotificationsParams): UseNotificationsResult {
  const [cachedUnreadCount, setCachedUnreadCount] = useState<number>(() => readUnreadCount())
  const [serverUnreadCount, setServerUnreadCount] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const queryClient = useQueryClient()
  const notificationsQueryKey = useMemo(() => ['notifications', token], [token])

  const notificationsQuery = useQuery<NotificationItem[]>({
    queryKey: notificationsQueryKey,
    enabled: Boolean(token) || isAuthenticated || hasInitialAuth,
    queryFn: async (): Promise<NotificationItem[]> => {
      try {
        const response = await fetchNotifications(token)
        const payload = (response && typeof response === 'object' ? response : {}) as NotificationsResponse
        const root = (payload as { data?: unknown }).data ?? payload

        const maybeUnreadCount = extractUnreadCount(payload)
        if (maybeUnreadCount != null) {
          setServerUnreadCount(maybeUnreadCount)
          setCachedUnreadCount(maybeUnreadCount)
          writeUnreadCount(maybeUnreadCount)
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
          writeUnreadCount(unreadFromPayload)
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
    refetchInterval: false,
    refetchIntervalInBackground: true,
    refetchOnMount: isAuthenticated ? 'always' : false,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  })

  useEffect(() => {
    if (!token || !isAuthenticated) return

    const backendUrl = getBackendBaseUrl()
    const socket: Socket = io(backendUrl, {
      transports: ['websocket'],
      withCredentials: true,
      auth: { token },
    })

    socket.on('notification:created', (payload: RawNotification) => {
      const mapped = mapNotificationPayload(payload)
      queryClient.setQueryData<NotificationItem[]>(notificationsQueryKey, (current) => {
        const list = current ?? []
        if (list.some((item) => item.id === mapped.id)) return list
        return [mapped, ...list]
      })
    })

    return () => {
      socket.disconnect()
    }
  }, [isAuthenticated, notificationsQueryKey, queryClient, token])

  const markAllReadMutation = useMutation({
    mutationFn: () => markAllNotificationsRead(token),
    onSuccess: () => {
      queryClient.setQueryData<NotificationItem[]>(notificationsQueryKey, (current) =>
        (current ?? []).map((item) => ({ ...item, read: true }))
      )
      setServerUnreadCount(0)
      setCachedUnreadCount(0)
      writeUnreadCount(0)
      queryClient.invalidateQueries({ queryKey: notificationsQueryKey })
    },
    onError: (err) => onMutationError?.(err, 'all'),
  })

  const markReadMutation = useMutation({
    mutationFn: (id: string) => markNotificationRead(id, token),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: notificationsQueryKey })

      const previous = queryClient.getQueryData<NotificationItem[]>(notificationsQueryKey) ?? []

      const next = previous.map((item) => (item.id === id ? { ...item, read: true } : item))
      const nextUnread = next.filter((item) => !item.read).length

      queryClient.setQueryData<NotificationItem[]>(notificationsQueryKey, next)
      setServerUnreadCount(nextUnread)
      setCachedUnreadCount(nextUnread)
      writeUnreadCount(nextUnread)

      return { previous }
    },
    onSuccess: (_data, id) => {
      let nextUnread = 0
      queryClient.setQueryData<NotificationItem[]>(notificationsQueryKey, (current) => {
        const next = (current ?? []).map((item) => (item.id === id ? { ...item, read: true } : item))
        nextUnread = next.filter((item) => !item.read).length
        return next
      })
      setServerUnreadCount(nextUnread)
      setCachedUnreadCount(nextUnread)
      writeUnreadCount(nextUnread)
      queryClient.invalidateQueries({ queryKey: notificationsQueryKey })
    },
    onError: (err, _id, context) => {
      const previous = context?.previous
      if (previous) {
        queryClient.setQueryData<NotificationItem[]>(notificationsQueryKey, previous)
        const nextUnread = previous.filter((item) => !item.read).length
        setServerUnreadCount(nextUnread)
        setCachedUnreadCount(nextUnread)
        writeUnreadCount(nextUnread)
      }
      onMutationError?.(err, 'one')
    },
  })

  const notificationData = (notificationsQuery.data ?? []) as NotificationItem[]

  useEffect(() => {
    // if (!notificationsQuery.isSuccess && serverUnreadCount === null && notificationData.length === 0) return
    if (error) return
    if (notificationData.length === 0) {
      setServerUnreadCount(0)
      setCachedUnreadCount(0)
      writeUnreadCount(0)
      return
    }
    const nextUnread = notificationData.filter((item) => !item.read).length
    if (!Number.isFinite(nextUnread) || nextUnread < 0) return

    setServerUnreadCount((prev) => (prev === nextUnread ? prev : nextUnread))
    setCachedUnreadCount((prev) => (prev === nextUnread ? prev : nextUnread))
    writeUnreadCount(nextUnread)
  }, [notificationsQuery.isSuccess, notificationData, serverUnreadCount, error])

  const unreadCount = useMemo(() => {
    if (error) return 0
    return notificationData.filter((item) => !item.read).length
  }, [error, notificationData])

  const markAllRead = () => {
    if (markAllReadMutation.isPending) return
    markAllReadMutation.mutate()
  }

  const markOneRead = async (id: string) => {
    if (markReadMutation.isPending) return
    await markReadMutation.mutateAsync(id)
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
