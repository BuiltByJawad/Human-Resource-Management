'use client'

import { useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { BellIcon, MagnifyingGlassIcon, ChevronDownIcon, Bars3Icon, ArrowLeftIcon } from '@heroicons/react/24/outline'
import { useAuthStore } from '@/store/useAuthStore'

import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useClickOutside } from '@/hooks/useClickOutside'
import MobileMenu from './MobileMenu'
import { useOrgStore } from '@/store/useOrgStore'
import api from '@/lib/axios'
import { cn } from '@/lib/utils'
import { useToast } from './ToastProvider'
import { PERMISSIONS } from '@/constants/permissions'

type NotificationCategory =
  | 'payroll'
  | 'leave'
  | 'compliance'
  | 'recruitment'
  | 'expense'
  | 'performance'
  | 'general'

type NotificationSeverity = 'low' | 'medium' | 'high'

type NotificationItem = {
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

type CategorizedNotification = NotificationItem & {
  isRelevant: boolean
}

const CATEGORY_RULES: Array<{
  category: NotificationCategory
  label: string
  colorClass: string
  keywords: RegExp
  permission?: (typeof PERMISSIONS)[keyof typeof PERMISSIONS]
}> = [
  {
    category: 'payroll',
    label: 'Payroll',
    colorClass: 'bg-emerald-100 text-emerald-700',
    keywords: /\b(payroll|salary|compensation|payout)\b/i,
    permission: PERMISSIONS.MANAGE_PAYROLL,
  },
  {
    category: 'leave',
    label: 'Leave',
    colorClass: 'bg-blue-100 text-blue-700',
    keywords: /\b(leave|vacation|time off|pto)\b/i,
    permission: PERMISSIONS.APPROVE_LEAVE,
  },
  {
    category: 'compliance',
    label: 'Compliance',
    colorClass: 'bg-amber-100 text-amber-700',
    keywords: /\b(compliance|audit|policy|violation)\b/i,
    permission: PERMISSIONS.MANAGE_COMPLIANCE,
  },
  {
    category: 'recruitment',
    label: 'Recruitment',
    colorClass: 'bg-purple-100 text-purple-700',
    keywords: /\b(recruitment|candidate|applicant|interview)\b/i,
    permission: PERMISSIONS.MANAGE_RECRUITMENT,
  },
  {
    category: 'expense',
    label: 'Expenses',
    colorClass: 'bg-rose-100 text-rose-700',
    keywords: /\b(expense|reimbursement|claim)\b/i,
    permission: PERMISSIONS.APPROVE_EXPENSES,
  },
  {
    category: 'performance',
    label: 'Performance',
    colorClass: 'bg-indigo-100 text-indigo-700',
    keywords: /\b(performance|review|feedback|evaluation)\b/i,
    permission: PERMISSIONS.MANAGE_PERFORMANCE_CYCLES,
  },
]

const SEVERITY_COLORS: Record<NotificationSeverity, string> = {
  low: 'bg-slate-400',
  medium: 'bg-amber-500',
  high: 'bg-rose-500',
}

function deriveCategoryMeta(notification: any) {
  const haystack = `${notification?.title ?? ''} ${notification?.message ?? ''}`.trim()
  const match = CATEGORY_RULES.find((rule) => rule.keywords.test(haystack))
  if (match) {
    return {
      category: match.category,
      categoryLabel: match.label,
      categoryColorClass: match.colorClass,
      requiresPermission: match.permission,
    }
  }

  return {
    category: 'general' as const,
    categoryLabel: 'General',
    categoryColorClass: 'bg-slate-100 text-slate-600',
    requiresPermission: undefined,
  }
}

function deriveSeverity(text: string): NotificationSeverity {
  const normalized = text.toLowerCase()
  if (/\b(urgent|failed|past due|overdue|breach|violation)\b/.test(normalized)) {
    return 'high'
  }
  if (/\b(pending|requires action|awaiting|due soon|reminder)\b/.test(normalized)) {
    return 'medium'
  }
  return 'low'
}

function mapNotificationPayload(raw: any): NotificationItem {
  const meta = deriveCategoryMeta(raw)
  const combinedText = `${raw?.title ?? ''} ${raw?.message ?? ''}`
  return {
    id: raw.id ?? crypto.randomUUID(),
    title: raw.title ?? 'Notification',
    message: raw.message ?? '',
    time: raw.createdAt ? new Date(raw.createdAt).toLocaleString() : 'Just now',
    read: !!raw.readAt,
    link: raw.link,
    category: meta.category,
    categoryLabel: meta.categoryLabel,
    categoryColorClass: meta.categoryColorClass,
    severity: deriveSeverity(combinedText),
    requiresPermission: meta.requiresPermission,
  }
}

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect
let headerMountedOnce = false

export default function Header() {
  const [isMounted, setIsMounted] = useState(() => (typeof window !== 'undefined' ? headerMountedOnce : false))
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false)

  const [searchQuery, setSearchQuery] = useState('')
  const [dismissedIds, setDismissedIds] = useState<string[]>([])
  const [notificationsError, setNotificationsError] = useState<string | null>(null)

  const { user, logout, hasPermission } = useAuthStore()
  const { siteName, tagline, loaded: orgLoaded } = useOrgStore()

  const router = useRouter()
  const queryClient = useQueryClient()
  const { showToast } = useToast()

  const avatarUrl = useMemo(() => {
    const raw = user?.avatarUrl
    if (!raw) return null
    if (/ui-avatars\.com\/api\//i.test(raw)) {
      return raw.includes('format=') ? raw : `${raw}${raw.includes('?') ? '&' : '?'}format=png`
    }
    return raw
  }, [user?.avatarUrl])

  const profileRef = useClickOutside<HTMLDivElement>(() => setIsProfileOpen(false))
  const notificationsRef = useClickOutside<HTMLDivElement>(() => setIsNotificationsOpen(false))

  useIsomorphicLayoutEffect(() => {
    headerMountedOnce = true
    setIsMounted(true)
  }, [])

  const handleLogout = async () => {
    await logout()
    router.replace('/login')
  }

  const notificationsQuery = useQuery<NotificationItem[]>({
    queryKey: ['notifications'],
    enabled: !!user,
    queryFn: async (): Promise<NotificationItem[]> => {
      try {
        const res = await api.get('/notifications')
        const raw = res.data?.data ?? []
        setNotificationsError(null)
        return (Array.isArray(raw) ? raw : []).map(mapNotificationPayload)
      } catch (err: any) {
        if (err?.response?.status === 403) {
          setNotificationsError('You do not have permission to view notifications.')
        } else {
          setNotificationsError('Failed to load notifications.')
        }
        return []
      }
    },
    staleTime: 15_000,
    refetchInterval: isNotificationsOpen ? 10_000 : false,
    refetchIntervalInBackground: false,
    refetchOnMount: false,
    refetchOnWindowFocus: isNotificationsOpen,
    refetchOnReconnect: isNotificationsOpen,
  })

  const notificationData: NotificationItem[] = notificationsQuery.data ?? []
  const notificationsLoading = notificationsQuery.isLoading

  const markAllReadMutation = useMutation({
    mutationFn: () => api.post('/notifications/mark-all-read'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
    onError: (err: any) => {
      if (err?.response?.status === 403) {
        showToast('You do not have permission to modify notifications.', 'error')
      } else {
        showToast('Failed to update notifications.', 'error')
      }
    },
  })

  const markReadMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
    onError: (err: any) => {
      if (err?.response?.status === 403) {
        showToast('You do not have permission to modify notifications.', 'error')
      } else {
        showToast('Failed to update notification.', 'error')
      }
    },
  })

  const notifications = useMemo(
    () => notificationData.filter((n: NotificationItem) => !dismissedIds.includes(n.id)),
    [notificationData, dismissedIds]
  )

  const categorizedNotifications = useMemo<CategorizedNotification[]>(
    () =>
      notifications.map((notification) => ({
        ...notification,
        isRelevant: !notification.requiresPermission || hasPermission(notification.requiresPermission),
      })),
    [notifications, hasPermission]
  )

  const actionableNotifications = useMemo(
    () => categorizedNotifications.filter((notification) => notification.isRelevant),
    [categorizedNotifications]
  )

  const informationalNotifications = useMemo(
    () => categorizedNotifications.filter((notification) => !notification.isRelevant),
    [categorizedNotifications]
  )

  const unreadCount = notificationsError ? 0 : categorizedNotifications.filter((n) => !n.read).length

  const handleMarkAllRead = () => {
    if (!notifications.length) return
    setDismissedIds((prev) => Array.from(new Set([...prev, ...notifications.map((n) => n.id)])))
    markAllReadMutation.mutate()
  }

  const handleNotificationClick = (notification: NotificationItem) => {
    if (!notification.read) {
      markReadMutation.mutate(notification.id)
    }

    setDismissedIds((prev) => (prev.includes(notification.id) ? prev : [...prev, notification.id]))
    if (notification.link) {
      router.push(notification.link)
      setIsNotificationsOpen(false)
    }
  }

  const initials = user?.firstName && user?.lastName
    ? `${user.firstName[0]}${user.lastName[0]}`
    : (user?.email?.[0]?.toUpperCase() ?? 'U')

  const userFullName = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim() || (user?.email ?? '')
  const userRole = user?.role ?? ''

  const hasValidUser = !!user?.id && !!user?.email
  const shouldShowOrgSkeleton = !orgLoaded && !siteName && !tagline
  if (!isMounted || !hasValidUser || shouldShowOrgSkeleton) {
    return (
      <header className="glass-header sticky top-0 z-30">
        <div className="flex items-center justify-between px-4 sm:px-6 py-4">
          <div className="md:hidden h-10 w-10 rounded-lg bg-slate-100 animate-pulse mr-3 flex-shrink-0" />

          <div className="flex items-center flex-1 gap-3">
            <div className="hidden sm:flex flex-col justify-center space-y-1">
              <div className="h-4 w-28 bg-slate-100 rounded animate-pulse" />
              <div className="h-7 w-36 bg-slate-100 rounded animate-pulse" />
            </div>

            <div className="flex-1" />

            <div className="relative w-full max-w-sm hidden md:block">
              <div className="w-full h-10 rounded-2xl border border-slate-200 bg-slate-50 animate-pulse" />
            </div>

            <div className="md:hidden h-10 w-10 rounded-full bg-slate-100 animate-pulse" />
          </div>

          <div className="ml-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-slate-100 animate-pulse" />
            <div className="flex h-12 items-center gap-3 rounded-full bg-white border border-slate-200 px-3 shadow-sm">
              <div className="h-8 w-8 rounded-full bg-slate-100 animate-pulse" />
              <div className="hidden md:flex flex-col gap-1">
                <div className="h-4 w-24 bg-slate-100 rounded animate-pulse" />
                <div className="h-3 w-16 bg-slate-100 rounded animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className="glass-header sticky top-0 z-30">
      <div className="flex items-center justify-between px-4 sm:px-6 py-4">
        {isMobileSearchOpen ? (
          <div className="flex items-center w-full gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <button
              onClick={() => setIsMobileSearchOpen(false)}
              className="p-2 -ml-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-full"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search employees..."
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    router.push(`/employees?search=${encodeURIComponent(searchQuery)}`)
                    setIsMobileSearchOpen(false)
                  }
                }}
                className="w-full h-10 rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        ) : (
          <>
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden h-10 w-10 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center mr-3 flex-shrink-0"
            >
              <Bars3Icon className="h-6 w-6" />
            </button>

            <div className="flex items-center flex-1 gap-3">
              <div className="hidden sm:flex flex-col">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{tagline}</p>
                <h1 className="text-lg font-semibold text-slate-900">{siteName}</h1>
              </div>
              <div className="flex-1" />

              <div className="relative w-full max-w-sm hidden md:block">
                <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search employees..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      router.push(`/employees?search=${encodeURIComponent(searchQuery)}`)
                    }
                  }}
                  className="w-full h-10 rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <button
                onClick={() => setIsMobileSearchOpen(true)}
                className="md:hidden h-10 w-10 rounded-full text-slate-500 hover:bg-slate-100 flex items-center justify-center"
              >
                <MagnifyingGlassIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="ml-4 flex items-center gap-3">
              <div className="relative" ref={notificationsRef}>
                <button
                  onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                  className="relative h-10 w-10 rounded-full bg-slate-100 text-slate-500 hover:text-slate-700 flex items-center justify-center"
                >
                  <BellIcon className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-rose-500 px-1.5 text-[11px] font-semibold text-white">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
                {isNotificationsOpen && (
                  <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 z-50">
                    <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-slate-800">Notifications</h3>

                      <button
                        onClick={handleMarkAllRead}
                        disabled={!notifications.length}
                        className={cn(
                          'text-xs font-medium',
                          notifications.length ? 'text-blue-600 hover:text-blue-700' : 'text-slate-400 cursor-not-allowed'
                        )}
                      >
                        Mark all read
                      </button>
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      {notificationsError ? (
                        <div className="px-4 py-6 text-sm text-rose-500 text-center">{notificationsError}</div>
                      ) : notificationsLoading && categorizedNotifications.length === 0 ? (
                        <div className="px-4 py-3 space-y-2">
                          <div className="h-3 w-1/2 bg-slate-100 rounded animate-pulse" />
                          <div className="h-3 w-2/3 bg-slate-100 rounded animate-pulse" />
                          <div className="h-3 w-1/3 bg-slate-100 rounded animate-pulse" />
                        </div>
                      ) : categorizedNotifications.length === 0 ? (
                        <div className="px-4 py-6 text-sm text-slate-500 text-center">No new notifications</div>
                      ) : (
                        <>
                          {actionableNotifications.length > 0 && (
                            <>
                              <p className="px-4 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                                Needs your attention
                              </p>
                              {actionableNotifications.map((notification) => (
                                <button
                                  key={notification.id}
                                  className={cn(
                                    'w-full px-4 py-3 text-left hover:bg-slate-50 transition border-l-2',
                                    notification.read ? 'border-transparent' : 'border-blue-500/70'
                                  )}
                                  onClick={() => handleNotificationClick(notification)}
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm font-semibold text-slate-900">{notification.title}</span>
                                        <span
                                          className={cn(
                                            'text-[10px] font-semibold px-2 py-0.5 rounded-full',
                                            notification.categoryColorClass
                                          )}
                                        >
                                          {notification.categoryLabel}
                                        </span>
                                      </div>
                                      <p className="text-xs text-slate-500">{notification.message}</p>
                                      <p className="text-[11px] text-slate-400">{notification.time}</p>
                                    </div>
                                    <span
                                      className={cn(
                                        'mt-1 h-2 w-2 rounded-full flex-shrink-0',
                                        SEVERITY_COLORS[notification.severity]
                                      )}
                                      aria-label={`${notification.severity} severity`}
                                    />
                                  </div>
                                </button>
                              ))}
                            </>
                          )}
                          {informationalNotifications.length > 0 && (
                            <>
                              <p className="px-4 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                                FYI
                              </p>
                              {informationalNotifications.map((notification) => (
                                <div
                                  key={notification.id}
                                  className="px-4 py-3 text-left bg-slate-50/80 border-l-2 border-dashed border-slate-200"
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-semibold text-slate-700">{notification.title}</span>
                                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">
                                      {notification.categoryLabel}
                                    </span>
                                  </div>
                                  <p className="text-xs text-slate-500">{notification.message}</p>
                                  <p className="text-[11px] text-slate-400 mt-1">{notification.time}</p>
                                  <p className="text-[11px] text-slate-500 mt-1">
                                    Shared for awareness. Requires {notification.categoryLabel.toLowerCase()} access to act.
                                  </p>
                                </div>
                              ))}
                            </>
                          )}
                        </>
                      )}
                    </div>

                    <div className="px-4 py-2 border-t border-slate-100">
                      <button className="text-sm text-blue-600 hover:text-blue-700">View all updates</button>
                    </div>
                  </div>
                )}
              </div>

              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex h-12 items-center gap-3 rounded-full bg-white border border-slate-200 px-3 text-sm text-slate-700 shadow-sm"
                >
                  {avatarUrl ? (
                    <div className="relative h-8 w-8 rounded-full overflow-hidden">
                      <Image
                        src={avatarUrl}
                        alt="Profile"
                        fill
                        className="object-cover"
                        sizes="32px"
                      />
                    </div>
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 text-white flex items-center justify-center font-semibold">
                      {initials}
                    </div>
                  )}
                  <div className="hidden md:flex flex-col text-left max-w-32">
                    <span className="text-sm font-semibold truncate leading-tight">{userFullName}</span>
                    {userRole ? (
                      <span className="text-xs text-slate-400 truncate leading-tight">{userRole}</span>
                    ) : (
                      <div className="h-2 w-16 bg-slate-100 rounded animate-pulse" />
                    )}
                  </div>

                  <ChevronDownIcon className="h-4 w-4 text-slate-400" />
                </button>

                {user && isProfileOpen && (
                  <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 z-50">
                    <div className="px-4 py-3 border-b border-slate-100">
                      <p className="text-sm font-semibold text-slate-900">{userFullName}</p>
                      <p className="text-xs text-slate-500">{user.email}</p>
                    </div>
                    <div className="py-1">
                      <Link href="/profile" className="block w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">
                        Profile
                      </Link>
                      <Link href="/settings" className="block w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">
                        Settings
                      </Link>
                    </div>
                    <div className="border-t border-slate-100">
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-rose-500 hover:bg-rose-50"
                      >
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
      <MobileMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} user={user} />
    </header>
  );
}