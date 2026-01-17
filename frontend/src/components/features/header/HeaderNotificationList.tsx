'use client'

import { SEVERITY_COLORS } from '@/lib/utils/notifications'
import { cn } from '@/lib/utils'
import { NotificationItem } from '@/services/notifications/types'

interface HeaderNotificationListProps {
  notifications: NotificationItem[]
  isLoading: boolean
  error: string | null
  onNotificationClick: (notification: NotificationItem) => void
}

export function HeaderNotificationList({ notifications, isLoading, error, onNotificationClick }: HeaderNotificationListProps) {
  if (error) {
    return <div className="px-4 py-6 text-sm text-rose-500 text-center">{error}</div>
  }

  if (isLoading && notifications.length === 0) {
    return (
      <div className="px-4 py-3 space-y-2">
        <div className="h-3 w-1/2 bg-slate-100 rounded animate-pulse" />
        <div className="h-3 w-2/3 bg-slate-100 rounded animate-pulse" />
      </div>
    )
  }

  if (!notifications.length) {
    return <div className="px-4 py-6 text-sm text-slate-500 text-center">No new notifications</div>
  }

  return (
    <div className="max-h-72 overflow-y-auto">
      {notifications.map((notification) => (
        <button
          key={notification.id}
          className={cn(
            'w-full px-4 py-3 text-left hover:bg-slate-50 transition border-l-2',
            notification.read ? 'border-transparent' : 'border-blue-500'
          )}
          onClick={() => onNotificationClick(notification)}
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
      ))}
    </div>
  )
}
