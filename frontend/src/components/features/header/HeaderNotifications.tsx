"use client"

import { useMemo, useState } from 'react'
import { BellIcon } from '@heroicons/react/24/outline'
import { useClickOutside } from '@/hooks/useClickOutside'
import { cn } from '@/lib/utils'
import { NotificationItem } from '@/services/notifications/types'
import { PERMISSIONS } from '@/constants/permissions'
import { HeaderNotificationList } from './HeaderNotificationList'

export type HeaderNotificationsProps = {
  isOpen: boolean
  onToggle: () => void
  unreadCount: number
  notifications: NotificationItem[]
  error: string | null
  isLoading: boolean
  onMarkAllRead: () => void
  onNotificationClick: (notification: NotificationItem) => void
  hasPermission: (perm: (typeof PERMISSIONS)[keyof typeof PERMISSIONS]) => boolean
}

export function HeaderNotifications({
  isOpen,
  onToggle,
  unreadCount,
  notifications,
  error,
  isLoading,
  onMarkAllRead,
  onNotificationClick,
  hasPermission,
}: HeaderNotificationsProps) {
  const [dismissedIds, setDismissedIds] = useState<string[]>([])
  const notificationsRef = useClickOutside<HTMLDivElement>(() => {
    if (isOpen) onToggle()
  })

  const filtered = useMemo(
    () => notifications.filter((n) => !dismissedIds.includes(n.id)),
    [notifications, dismissedIds]
  )

  const actionable = useMemo(
    () =>
      filtered
        .map((notification) => ({
          ...notification,
          isRelevant: !notification.requiresPermission || hasPermission(notification.requiresPermission),
        }))
        .filter((n) => n.isRelevant),
    [filtered, hasPermission]
  )

  const handleClick = (notification: NotificationItem) => {
    setDismissedIds((prev) => (prev.includes(notification.id) ? prev : [...prev, notification.id]))
    onNotificationClick(notification)
  }

  return (
    <div className="relative" ref={notificationsRef}>
      <button
        onClick={onToggle}
        className="relative h-10 w-10 rounded-full bg-slate-100 text-slate-500 hover:text-slate-700 flex items-center justify-center"
      >
        <BellIcon className="h-5 w-5" />
        <span
          suppressHydrationWarning
          className={cn(
            'absolute -top-0.5 -right-0.5 inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-rose-500 px-1.5 text-[11px] font-semibold text-white transition-opacity',
            unreadCount > 0 ? 'opacity-100' : 'opacity-0'
          )}
        >
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 z-50">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-800">Notifications</h3>
            <button
              onClick={onMarkAllRead}
              disabled={!filtered.length}
              className={cn(
                'text-xs font-medium',
                filtered.length ? 'text-blue-600 hover:text-blue-700' : 'text-slate-400 cursor-not-allowed'
              )}
            >
              Mark all read
            </button>
          </div>

          <HeaderNotificationList
            notifications={actionable}
            isLoading={isLoading}
            error={error}
            onNotificationClick={handleClick}
          />
        </div>
      )}
    </div>
  )
}
