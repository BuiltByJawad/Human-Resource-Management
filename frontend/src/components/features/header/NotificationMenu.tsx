'use client'

import { useMemo, useState } from 'react'
import { BellIcon } from '@heroicons/react/24/outline'
import { useClickOutside } from '@/hooks/useClickOutside'
import { cn } from '@/lib/utils'
import { NotificationItem } from '@/services/notifications/types'
import { SEVERITY_COLORS } from '@/lib/utils/notifications'
import { PERMISSIONS } from '@/constants/permissions'

export type NotificationMenuProps = {
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

export function NotificationMenu({
  isOpen,
  onToggle,
  unreadCount,
  notifications,
  error,
  isLoading,
  onMarkAllRead,
  onNotificationClick,
  hasPermission,
}: NotificationMenuProps) {
  const [dismissedIds, setDismissedIds] = useState<string[]>([])
  const notificationsRef = useClickOutside<HTMLDivElement>(() => {
    if (isOpen) onToggle()
  })

  const filtered = useMemo(
    () => notifications.filter((n) => !dismissedIds.includes(n.id)),
    [notifications, dismissedIds]
  )

  const categorized = useMemo(
    () =>
      filtered.map((notification) => ({
        ...notification,
        isRelevant: !notification.requiresPermission || hasPermission(notification.requiresPermission),
      })),
    [filtered, hasPermission]
  )

  const actionable = useMemo(
    () => categorized.filter((n) => n.isRelevant),
    [categorized]
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
          <div className="max-h-72 overflow-y-auto">
            {error ? (
              <div className="px-4 py-6 text-sm text-rose-500 text-center">{error}</div>
            ) : isLoading && categorized.length === 0 ? (
              <div className="px-4 py-3 space-y-2">
                <div className="h-3 w-1/2 bg-slate-100 rounded animate-pulse" />
                <div className="h-3 w-2/3 bg-slate-100 rounded animate-pulse" />
              </div>
            ) : categorized.length === 0 ? (
              <div className="px-4 py-6 text-sm text-slate-500 text-center">No new notifications</div>
            ) : (
              actionable.map((notification) => (
                <button
                  key={notification.id}
                  className={cn(
                    'w-full px-4 py-3 text-left hover:bg-slate-50 transition border-l-2',
                    notification.read ? 'border-transparent' : 'border-blue-500'
                  )}
                  onClick={() => handleClick(notification)}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-900">{notification.title}</span>
                      <span className={cn('h-1.5 w-1.5 rounded-full', SEVERITY_COLORS[notification.severity])} />
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-2">{notification.message}</p>
                    <p className="text-[10px] text-slate-400 uppercase tracking-tight">{notification.time}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
