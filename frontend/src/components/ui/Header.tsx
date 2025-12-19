'use client'

import { useMemo, useState } from 'react'
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

type NotificationItem = {
  id: string
  title: string
  message: string
  time: string
  read: boolean
  link?: string
}

export default function Header() {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [dismissedIds, setDismissedIds] = useState<string[]>([])
  const [notificationsError, setNotificationsError] = useState<string | null>(null)

  const { user, logout } = useAuthStore()
  const { siteName, tagline, loaded: orgLoaded } = useOrgStore()

  const router = useRouter()
  const queryClient = useQueryClient()
  const { showToast } = useToast()

  const profileRef = useClickOutside<HTMLDivElement>(() => setIsProfileOpen(false))
  const notificationsRef = useClickOutside<HTMLDivElement>(() => setIsNotificationsOpen(false))

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  const { data: notificationData = [], isLoading: notificationsLoading } = useQuery({
    queryKey: ['notifications'],
    enabled: !!user,
    queryFn: async (): Promise<NotificationItem[]> => {
      const res = await api.get('/notifications')
      const raw = res.data?.data ?? []
      return (Array.isArray(raw) ? raw : []).map((n: any) => ({
        id: n.id ?? crypto.randomUUID(),
        title: n.title ?? 'Notification',
        message: n.message ?? '',
        time: n.createdAt ? new Date(n.createdAt).toLocaleString() : 'Just now',
        read: !!n.readAt,
        link: n.link,
      }))
    },
    staleTime: 60_000,
    onError: (err: any) => {
      if (err?.response?.status === 403) {
        setNotificationsError('You do not have permission to view notifications.')
      } else {
        setNotificationsError('Failed to load notifications.')
      }
    },
  })

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
    () => notificationData.filter((n) => !dismissedIds.includes(n.id)),
    [notificationData, dismissedIds]
  )

  const unreadCount = notificationsError ? 0 : notifications.filter((n) => !n.read).length

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

  // Show skeleton if we don't have user yet, or org not loaded and no cached branding
  const shouldShowOrgSkeleton = !orgLoaded && !siteName && !tagline
  if (!user || shouldShowOrgSkeleton) {

    return (
      <header className="bg-white/95 backdrop-blur-sm shadow-sm sticky top-0 z-30">
        <div className="flex items-center justify-between px-4 sm:px-6 py-4">
          <div className="flex items-center flex-1 gap-3">
            <div className="hidden sm:flex flex-col gap-2">
              <div className="h-3 w-28 bg-slate-100 rounded animate-pulse" />
              <div className="h-4 w-36 bg-slate-100 rounded animate-pulse" />
            </div>

            <div className="flex-1"></div>
            <div className="relative w-full max-w-sm">
              <div className="w-full h-10 rounded-2xl bg-slate-100 animate-pulse"></div>
            </div>
          </div>
          <div className="ml-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-slate-100 animate-pulse"></div>
            <div className="flex h-12 items-center gap-3 rounded-full bg-white border border-slate-200 px-3 shadow-sm">
              <div className="h-8 w-8 rounded-full bg-slate-100 animate-pulse"></div>
              <div className="hidden md:flex flex-col gap-1">
                <div className="h-3 w-24 bg-slate-100 rounded animate-pulse"></div>
                <div className="h-2 w-16 bg-slate-100 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </header>
    )
  }

  const initials = user?.firstName && user?.lastName
    ? `${user.firstName[0]}${user.lastName[0]}`
    : (user?.email?.[0]?.toUpperCase() ?? 'U')
  const userFullName = user ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email : 'User'
  const userRole = user?.role ?? 'Member'

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
            {/* Mobile menu button */}
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
              <div className="flex-1"></div>

              {/* Search Bar - Hidden on mobile, visible on desktop */}
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

              {/* Mobile Search Icon */}
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
                    <div className="max-h-64 overflow-y-auto">
                      {notificationsError ? (
                        <div className="px-4 py-6 text-sm text-rose-500 text-center">{notificationsError}</div>
                      ) : notificationsLoading && notifications.length === 0 ? (
                        <div className="px-4 py-3 space-y-2">
                          <div className="h-3 w-1/2 bg-slate-100 rounded animate-pulse" />
                          <div className="h-3 w-2/3 bg-slate-100 rounded animate-pulse" />
                          <div className="h-3 w-1/3 bg-slate-100 rounded animate-pulse" />
                        </div>
                      ) : notifications.length === 0 ? (
                        <div className="px-4 py-6 text-sm text-slate-500 text-center">No new notifications</div>
                      ) : (
                        notifications.map((notification) => (
                          <div
                            key={notification.id}
                            className="px-4 py-3 hover:bg-slate-50 transition cursor-pointer"
                            onClick={() => handleNotificationClick(notification)}
                          >
                            <p className="text-sm font-medium text-slate-900">{notification.title}</p>
                            <p className="text-xs text-slate-500">{notification.message}</p>
                            <p className="text-xs text-slate-400 mt-1">{notification.time}</p>
                          </div>
                        ))
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
                  {user?.avatarUrl ? (
                    <div className="relative h-8 w-8 rounded-full overflow-hidden">
                      <Image
                        src={user.avatarUrl}
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
                  <div className="hidden md:flex flex-col text-left">
                    <span className="text-sm font-semibold">{userFullName}</span>
                    <span className="text-xs text-slate-400">{userRole}</span>
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
                      <Link href="/profile" className="block w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">Profile</Link>
                      <Link href="/settings" className="block w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">Settings</Link>
                      <button className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">Support</button>
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
  )
}