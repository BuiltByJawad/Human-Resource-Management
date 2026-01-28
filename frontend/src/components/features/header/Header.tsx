"use client"

import { useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Bars3Icon } from '@heroicons/react/24/outline'
import { useBranding } from '@/components/providers/BrandingProvider'
import { useBrandingStore } from '@/store/useBrandingStore'
import { useAuthStore } from '@/store/useAuthStore'
import MobileMenu from '@/components/ui/MobileMenu'
import { useNotifications } from '@/hooks/useNotifications'
import { useDisplayUser } from '@/hooks/useDisplayUser'
import { NotificationItem } from '@/services/notifications/types'
import { HeaderActions } from './HeaderActions'
import { HeaderBranding } from './HeaderBranding'
import { HeaderSearchControls } from './HeaderSearchControls'
import { HeaderMobileSearch } from './HeaderMobileSearch'
import { HeaderShell } from './HeaderShell'
import { useToast } from '@/components/ui/ToastProvider'

export default function Header() {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const { user, token, logout, hasPermission, isAuthenticated, isAuthTransition, endAuthTransition } = useAuthStore()
  const { initialAuth, displayUser } = useDisplayUser()
  const effectiveToken = token ?? initialAuth?.token ?? null
  const hasInitialAuth = Boolean(initialAuth?.user || initialAuth?.token)

  const { showToast } = useToast()
  const router = useRouter()
  const branding = useBranding()
  const { siteName: storeSiteName, tagline: storeTagline } = useBrandingStore()

  const pathname = usePathname()
  const searchParams = useSearchParams()

  const handleSearchSubmit = () => {
    const trimmed = searchQuery.trim()
    if (!trimmed) {
      router.push('/employees')
      return
    }
    router.push(`/employees?search=${encodeURIComponent(trimmed)}`)
  }

  const { notifications, unreadCount, isLoading, error, markAllRead, markOneRead } = useNotifications({
    token: effectiveToken,
    isAuthenticated,
    hasInitialAuth,
    onMutationError: (err, scope) => {
      const status = err?.response?.status
      if (status === 403) {
        showToast('You do not have permission to modify notifications.', 'error')
      } else {
        showToast(scope === 'all' ? 'Failed to update notifications.' : 'Failed to update notification.', 'error')
      }
    },
  })

  useEffect(() => {
    if (!isAuthTransition) return
    if (!isAuthenticated) return
    endAuthTransition()
  }, [isAuthTransition, isAuthenticated, endAuthTransition])

  const urlSearchQuery = useMemo(() => (searchParams.get('search') ?? '').trim(), [searchParams])

  useEffect(() => {
    if (!pathname.startsWith('/employees')) return
    setSearchQuery(urlSearchQuery)
  }, [pathname, urlSearchQuery])

  const siteName = branding?.siteName || storeSiteName
  const tagline = branding?.tagline || storeTagline

  const avatarUrl = useMemo(() => {
    const raw = displayUser?.avatarUrl
    if (!raw) return null
    if (/ui-avatars\.com\/api\//i.test(raw)) {
      return raw.includes('format=') ? raw : `${raw}${raw.includes('?') ? '&' : '?'}format=png`
    }
    return raw
  }, [displayUser?.avatarUrl])

  const initials = displayUser?.firstName && displayUser?.lastName
    ? `${displayUser.firstName[0]}${displayUser.lastName[0]}`
    : (displayUser?.email?.[0]?.toUpperCase() ?? 'U')

  const userFullName = `${displayUser?.firstName ?? ''} ${displayUser?.lastName ?? ''}`.trim() || (displayUser?.email ?? '')
  const userRole = displayUser?.role ?? ''
  const shouldShowNotificationControls = Boolean(effectiveToken || isAuthenticated)

  const handleLogout = async () => {
    await logout()
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    } else {
      router.replace('/login')
    }
  }

  const handleNotificationClick = async (notification: NotificationItem) => {
    await markOneRead(notification.id)
    if (notification.link) {
      router.push(notification.link)
    }
    setIsNotificationsOpen(false)
  }

  return (
    <HeaderShell
      isMobileSearchOpen={isMobileSearchOpen}
      mobileSearch={
        <HeaderMobileSearch
          searchQuery={searchQuery}
          onChange={setSearchQuery}
          onSubmit={() => {
            handleSearchSubmit()
            setIsMobileSearchOpen(false)
          }}
          onClose={() => setIsMobileSearchOpen(false)}
        />
      }
      defaultContent={
        <>
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="md:hidden h-10 w-10 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center mr-3 flex-shrink-0"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>

          <div className="flex items-center flex-1 gap-3 min-w-0">
            <HeaderBranding siteName={siteName} tagline={tagline} />

            <div className="flex-1" />

            <HeaderSearchControls
              searchQuery={searchQuery}
              onChange={setSearchQuery}
              onSubmit={handleSearchSubmit}
              onOpenMobileSearch={() => setIsMobileSearchOpen(true)}
            />
          </div>

          <div className="ml-4 flex items-center gap-3">
            <HeaderActions
              shouldShowNotificationControls={shouldShowNotificationControls}
              isNotificationsOpen={isNotificationsOpen}
              onToggleNotifications={() => setIsNotificationsOpen((prev) => !prev)}
              unreadCount={unreadCount}
              notifications={notifications}
              error={error}
              isLoading={isLoading}
              onMarkAllRead={markAllRead}
              onNotificationClick={handleNotificationClick}
              hasPermission={hasPermission}
              userFullName={userFullName}
              userRole={userRole}
              email={displayUser?.email}
              initials={initials}
              avatarUrl={avatarUrl}
              onLogout={handleLogout}
            />
          </div>
        </>
      }
      mobileMenu={<MobileMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} user={user} />}
    />
  )
}
