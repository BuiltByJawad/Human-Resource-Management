'use client'

import { useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { useBranding } from '@/components/providers/BrandingProvider'
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
import { useInitialAuth } from '@/components/providers/AuthBootstrapProvider'

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
  const initialAuth = useInitialAuth()
  // Prefer server-fetched user on first paint to avoid showing stale
  // persisted auth data, then fall back to the client store user.
  const effectiveUser = (initialAuth?.user ?? user) as any
  const branding = useBranding()
  const { siteName: storeSiteName, tagline: storeTagline, loaded: orgLoaded } = useOrgStore()

  const siteName = branding?.siteName || storeSiteName
  const tagline = branding?.tagline || storeTagline

  const router = useRouter()
  const queryClient = useQueryClient()
  const { showToast } = useToast()

  const avatarUrl = useMemo(() => {
    const raw = effectiveUser?.avatarUrl
    if (!raw) return null
    if (/ui-avatars\.com\/api\//i.test(raw)) {
      return raw.includes('format=') ? raw : `${raw}${raw.includes('?') ? '&' : '?'}format=png`
    }
    return raw
  }, [effectiveUser?.avatarUrl])

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
    enabled: !!effectiveUser,
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

  const initials = effectiveUser?.firstName && effectiveUser?.lastName
    ? `${effectiveUser.firstName[0]}${effectiveUser.lastName[0]}`
    : (effectiveUser?.email?.[0]?.toUpperCase() ?? 'U')

  const userFullName = `${effectiveUser?.firstName ?? ''} ${effectiveUser?.lastName ?? ''}`.trim() || (effectiveUser?.email ?? '')
  const userRole = effectiveUser?.role ?? ''

  const hasValidUser = !!effectiveUser?.id && !!effectiveUser?.email

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
                className="w-full h-10 rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              {/* Branding Section - Instantly available via server-side fetch & StoreHydrator */}
              {siteName || tagline ? (
                <div className="hidden sm:flex flex-col">
                  {tagline && <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{tagline}</p>}
                  {siteName && <h1 className="text-lg font-semibold text-slate-900">{siteName}</h1>}
                </div>
              ) : (
                <div className="hidden sm:flex flex-col">
                  <div className="h-3 w-20 bg-slate-100 rounded animate-pulse mb-1" />
                  <div className="h-6 w-32 bg-slate-100 rounded animate-pulse" />
                </div>
              )}

              <div className="flex-1" />

              {/* Desktop search input does not depend on async data, so we render
                  it directly without a skeleton to avoid flicker on refresh. */}
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
                  className="w-full h-10 rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              {/* Notification & Profile Section */}
              {hasValidUser ? (
                <>
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
                            </div>
                          ) : categorizedNotifications.length === 0 ? (
                            <div className="px-4 py-6 text-sm text-slate-500 text-center">No new notifications</div>
                          ) : (
                            actionableNotifications.map((notification) => (
                              <button
                                key={notification.id}
                                className={cn(
                                  'w-full px-4 py-3 text-left hover:bg-slate-50 transition border-l-2',
                                  notification.read ? 'border-transparent' : 'border-blue-500'
                                )}
                                onClick={() => handleNotificationClick(notification)}
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

                  <div className="relative" ref={profileRef}>
                    <button
                      onClick={() => setIsProfileOpen(!isProfileOpen)}
                      className="flex h-12 items-center gap-3 rounded-full bg-white border border-slate-200 px-3 text-sm text-slate-700 shadow-sm"
                    >
                      {avatarUrl ? (
                        <div className="relative h-8 w-8 rounded-full overflow-hidden">
                          <Image src={avatarUrl} alt="Profile" fill className="object-cover" sizes="32px" />
                        </div>
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 text-white flex items-center justify-center font-semibold text-xs">
                          {initials}
                        </div>
                      )}
                      <div className="hidden md:flex flex-col text-left max-w-32">
                        <span className="text-sm font-semibold truncate leading-tight">{userFullName}</span>
                        <span className="text-xs text-slate-400 truncate leading-tight uppercase tracking-wider">{userRole}</span>
                      </div>
                      <ChevronDownIcon className="h-4 w-4 text-slate-400" />
                    </button>

                    {isProfileOpen && (
                      <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 z-50">
                        <div className="px-4 py-3 border-b border-slate-100">
                          <p className="text-sm font-semibold text-slate-900 truncate">{userFullName}</p>
                          <p className="text-xs text-slate-500 truncate">{effectiveUser?.email}</p>
                        </div>
                        <div className="py-1">
                          <Link href="/profile" className="block w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">Profile</Link>
                          <Link href="/settings" className="block w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">Settings</Link>
                        </div>
                        <div className="border-t border-slate-100">
                          <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-rose-500 hover:bg-rose-50">Sign out</button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="h-10 w-10 rounded-full bg-slate-100 animate-pulse" />
                  <div className="flex h-12 items-center gap-3 rounded-full bg-white border border-slate-200 px-3 shadow-sm">
                    <div className="h-8 w-8 rounded-full bg-slate-100 animate-pulse" />
                    <div className="hidden md:flex flex-col gap-1">
                      <div className="h-4 w-20 bg-slate-100 rounded animate-pulse" />
                      <div className="h-3 w-14 bg-slate-100 rounded animate-pulse" />
                    </div>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
      <MobileMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} user={effectiveUser}
      />
    </header>
  );
}
