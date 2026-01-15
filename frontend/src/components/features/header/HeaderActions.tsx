'use client'

import { NotificationItem } from '@/services/notifications/types'
import { NotificationMenu } from './NotificationMenu'
import { ProfileMenu } from './ProfileMenu'

export type HeaderActionsProps = {
  shouldShowNotificationControls: boolean
  isNotificationsOpen: boolean
  onToggleNotifications: () => void
  unreadCount: number
  notifications: NotificationItem[]
  error: string | null
  isLoading: boolean
  onMarkAllRead: () => void
  onNotificationClick: (notification: NotificationItem) => void
  hasPermission: (perm: any) => boolean
  userFullName: string
  userRole: string
  email?: string
  initials: string
  avatarUrl: string | null
  onLogout: () => void
}

export function HeaderActions({
  shouldShowNotificationControls,
  isNotificationsOpen,
  onToggleNotifications,
  unreadCount,
  notifications,
  error,
  isLoading,
  onMarkAllRead,
  onNotificationClick,
  hasPermission,
  userFullName,
  userRole,
  email,
  initials,
  avatarUrl,
  onLogout,
}: HeaderActionsProps) {
  if (!shouldShowNotificationControls) {
    return (
      <div className="flex items-center gap-3">
        <div className="relative">
          <button
            type="button"
            disabled
            className="relative h-10 w-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center cursor-not-allowed"
            title="Loading..."
          >
            <span className="h-5 w-5 block" />
          </button>
        </div>
        <div className="flex h-12 items-center gap-3 rounded-full bg-white border border-slate-200 px-3 shadow-sm">
          <div className="h-8 w-8 rounded-full bg-slate-100 animate-pulse" />
          <div className="hidden md:flex flex-col gap-1">
            <div className="h-4 w-20 bg-slate-100 rounded animate-pulse" />
            <div className="h-3 w-14 bg-slate-100 rounded animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <NotificationMenu
        isOpen={isNotificationsOpen}
        onToggle={onToggleNotifications}
        unreadCount={unreadCount}
        notifications={notifications}
        error={error}
        isLoading={isLoading}
        onMarkAllRead={onMarkAllRead}
        onNotificationClick={onNotificationClick}
        hasPermission={hasPermission}
      />

      <ProfileMenu
        userFullName={userFullName}
        userRole={userRole}
        email={email}
        initials={initials}
        avatarUrl={avatarUrl}
        onLogout={onLogout}
      />
    </div>
  )
}
