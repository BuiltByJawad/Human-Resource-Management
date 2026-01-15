'use client'
import { useMemo, useState, useEffect } from 'react'
import { useBranding } from '@/components/providers/BrandingProvider'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import {
  HomeIcon,
  UsersIcon,
  BuildingOfficeIcon,
  ClipboardDocumentListIcon,
  ClockIcon,
  BanknotesIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  SparklesIcon,
  ShieldCheckIcon,
  KeyIcon,
  ChevronDoubleLeftIcon,
  UserGroupIcon,
  ComputerDesktopIcon,
  ExclamationTriangleIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
  AcademicCapIcon,
  FlagIcon,
  UserCircleIcon,
  HeartIcon,
  CreditCardIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline'
import { useAuthStore } from '@/store/useAuthStore'
import { useOrgStore } from '@/store/useOrgStore'
import { PERMISSIONS, type Permission } from '@/constants/permissions'
import { useInitialAuth } from '@/components/providers/AuthBootstrapProvider'
import { buildTenantStorageKey, getClientTenantSlug } from '@/lib/tenant'

type NavIcon = typeof HomeIcon

type NavItem = {
  name: string
  href: string
  icon: NavIcon
  permissions?: Permission[]
  requiresEmployeeProfile?: boolean
}

const navigation: { label: string; items: NavItem[]; isPersonal?: boolean }[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // MY WORKSPACE - Self-service section (visible to ALL users, no permissions)
  // Follows BambooHR pattern: "Home" / "My Info" at top
  // ═══════════════════════════════════════════════════════════════════════════
  {
    label: 'My Workspace',
    isPersonal: true,
    items: [
      { name: 'My Dashboard', href: '/portal', icon: UserCircleIcon, requiresEmployeeProfile: true },
      { name: 'My Shifts', href: '/portal/shifts', icon: CalendarDaysIcon, requiresEmployeeProfile: true },
      { name: 'My Documents', href: '/portal/documents', icon: DocumentTextIcon, requiresEmployeeProfile: true },
      { name: 'My Training', href: '/portal/training', icon: AcademicCapIcon, requiresEmployeeProfile: true },
      { name: 'My Goals', href: '/portal/goals', icon: FlagIcon, requiresEmployeeProfile: true },
      { name: 'My Benefits', href: '/portal/benefits', icon: HeartIcon, requiresEmployeeProfile: true },
      { name: 'My Expenses', href: '/portal/expenses', icon: CreditCardIcon, requiresEmployeeProfile: true },
      { name: 'My Offboarding', href: '/portal/offboarding', icon: ArrowTrendingDownIcon, requiresEmployeeProfile: true },
      { name: 'My Leave', href: '/leave', icon: ClipboardDocumentListIcon, requiresEmployeeProfile: true },
    ],
  },
  // ═══════════════════════════════════════════════════════════════════════════
  // ADMIN SECTIONS - Permission-gated (only visible to users with access)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    label: 'HR Management',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: HomeIcon, permissions: [PERMISSIONS.VIEW_EMPLOYEES] },
      { name: 'Analytics Hub', href: '/analytics', icon: ChartBarIcon, permissions: [PERMISSIONS.VIEW_ANALYTICS] },
      { name: 'Employees', href: '/employees', icon: UsersIcon, permissions: [PERMISSIONS.VIEW_EMPLOYEES] },
      { name: 'Departments', href: '/departments', icon: BuildingOfficeIcon, permissions: [PERMISSIONS.MANAGE_DEPARTMENTS] },
      { name: 'Attendance', href: '/attendance', icon: ClockIcon, permissions: [PERMISSIONS.VIEW_ATTENDANCE] },
      { name: 'Leave Requests', href: '/leave/requests', icon: ClipboardDocumentListIcon, permissions: [PERMISSIONS.VIEW_LEAVE_REQUESTS, PERMISSIONS.APPROVE_LEAVE, PERMISSIONS.MANAGE_LEAVE_REQUESTS, PERMISSIONS.MANAGE_LEAVE_POLICIES] },
    ],
  },
  {
    label: 'Operations',
    items: [
      { name: 'Payroll', href: '/payroll', icon: BanknotesIcon, permissions: [PERMISSIONS.VIEW_PAYROLL] },
      { name: 'Benefits', href: '/benefits', icon: HeartIcon, permissions: [PERMISSIONS.VIEW_BENEFITS] },
      { name: 'Expenses', href: '/expenses', icon: CreditCardIcon, permissions: [PERMISSIONS.VIEW_EXPENSES] },
      { name: 'Expense Approvals', href: '/expenses/approvals', icon: CreditCardIcon, permissions: [PERMISSIONS.APPROVE_EXPENSES, PERMISSIONS.MANAGE_EXPENSES] },
      { name: 'Training', href: '/training', icon: AcademicCapIcon, permissions: [PERMISSIONS.VIEW_TRAINING] },
      { name: 'Shifts', href: '/shifts', icon: CalendarDaysIcon, permissions: [PERMISSIONS.VIEW_ATTENDANCE] },
      { name: 'Time Tracking', href: '/time-tracking', icon: ClockIcon, permissions: [PERMISSIONS.VIEW_ATTENDANCE] },
      { name: 'Offboarding', href: '/offboarding', icon: ArrowTrendingDownIcon, permissions: [PERMISSIONS.VIEW_OFFBOARDING] },
      { name: 'Assets', href: '/assets', icon: ComputerDesktopIcon, permissions: [PERMISSIONS.VIEW_ASSETS] },
      { name: 'Performance', href: '/performance', icon: SparklesIcon, permissions: [PERMISSIONS.VIEW_PERFORMANCE] },
      { name: 'Burnout Analytics', href: '/analytics/burnout', icon: ExclamationTriangleIcon, permissions: [PERMISSIONS.VIEW_ANALYTICS] },
      { name: 'Recruitment', href: '/recruitment', icon: UserGroupIcon, permissions: [PERMISSIONS.MANAGE_RECRUITMENT] },
      { name: 'Reports', href: '/reports', icon: ChartBarIcon, permissions: [PERMISSIONS.VIEW_REPORTS] },
      { name: 'Compliance', href: '/compliance', icon: ShieldCheckIcon, permissions: [PERMISSIONS.VIEW_COMPLIANCE] },
    ],
  },
  {
    label: 'System',
    items: [
      { name: 'Documents', href: '/documents', icon: DocumentTextIcon, permissions: [PERMISSIONS.MANAGE_SYSTEM_SETTINGS] },
      { name: 'Roles & Permissions', href: '/roles', icon: KeyIcon, permissions: [PERMISSIONS.MANAGE_ROLES] },
      { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
    ],
  },
]

// Track whether the sidebar has already hydrated once in this browser tab.
// On the very first load, we start with isMounted=false so SSR and the
// first client render match. After that, all subsequent mounts (client-side
// navigations) start with isMounted=true so we don't re-show skeletons.
let sidebarHydratedOnce = false

function useSidebarState() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMounted, setIsMounted] = useState(() =>
    typeof window !== 'undefined' ? sidebarHydratedOnce : false,
  )

  useEffect(() => {
    // Check if the class was set by the inline script in layout
    const hasClass = document.documentElement.classList.contains('sidebar-collapsed')
    setIsCollapsed(hasClass)
    sidebarHydratedOnce = true
    setIsMounted(true)
  }, [])

  const toggle = () => {
    setIsCollapsed(prev => {
      const newState = !prev
      localStorage.setItem('sidebarCollapsed', String(newState))
      // Update the class for consistency
      if (newState) {
        document.documentElement.classList.add('sidebar-collapsed')
      } else {
        document.documentElement.classList.remove('sidebar-collapsed')
      }
      return newState
    })
  }

  return { isCollapsed, isMounted, toggle }
}

export default function Sidebar() {
  const { toggle, isMounted } = useSidebarState()
  const router = useRouter()
  const storeUser = useAuthStore((state) => state.user)
  const branding = useBranding()
  const { siteName: storeSiteName, shortName: storeShortName, tagline: storeTagline, logoUrl: storeLogoUrl, loaded: orgLoaded } = useOrgStore()
  const initialAuth = useInitialAuth()
  // Prefer server-fetched user for SSR/first paint; fall back to client store
  const user = (initialAuth?.user ?? storeUser) as any

  // Prioritize server-fetched data from context to ensure SSR/CSR match
  const siteName = branding?.siteName || storeSiteName
  const shortName = branding?.shortName || storeShortName
  const tagline = branding?.tagline || storeTagline
  const logoUrl = branding?.logoUrl || storeLogoUrl

  const pathname = usePathname()
  const isSuperAdmin = user?.role === 'Super Admin'
  const userPermissions: string[] = Array.isArray(user?.permissions) ? user.permissions : []

  const activeHref = (() => {
    const allItems = navigation.flatMap(section => section.items)
    const matches = allItems
      .map(item => item.href)
      .filter(href => pathname === href || pathname.startsWith(`${href}/`))
    if (matches.length === 0) return null
    return matches.sort((a, b) => b.length - a.length)[0]
  })()

  // canSeeItem uses the server-fetched user permissions so SSR and
  // first client render see the same navigation items.
  const canSeeItem = (item: NavItem) => {
    if (item.requiresEmployeeProfile) {
      return !!user?.employee?.id
    }
    if (!item.permissions || item.permissions.length === 0) return true
    if (isSuperAdmin) return true
    if (!userPermissions.length) return false
    return item.permissions.some((perm) => userPermissions.includes(perm))
  }

  const cachedUser = useMemo(() => {
    if (typeof window === 'undefined') return null

    const parseCachedUser = (raw: string | null) => {
      if (!raw) return null
      try {
        const parsed = JSON.parse(raw) as { state?: { user?: unknown }; user?: unknown }
        const state = parsed?.state ?? parsed
        const cached = state?.user as Record<string, unknown> | undefined
        if (!cached || typeof cached !== 'object') return null
        return {
          id: typeof cached.id === 'string' ? cached.id : undefined,
          email: typeof cached.email === 'string' ? cached.email : undefined,
          firstName: typeof cached.firstName === 'string' ? cached.firstName : null,
          lastName: typeof cached.lastName === 'string' ? cached.lastName : null,
          avatarUrl: typeof cached.avatarUrl === 'string' ? cached.avatarUrl : null,
        }
      } catch {
        return null
      }
    }

    const tenantKey = buildTenantStorageKey('auth-storage', getClientTenantSlug())
    const local = parseCachedUser(window.localStorage.getItem(tenantKey))
    if (local) return local
    const session = parseCachedUser(window.sessionStorage.getItem(tenantKey))
    if (session) return session
    return parseCachedUser(window.localStorage.getItem('auth-storage'))
  }, [])

  const displayUser = user ?? cachedUser
  const hasUser = !!displayUser

  const avatarUrl = useMemo(() => {
    const raw = displayUser?.avatarUrl
    if (!raw) return null
    if (/ui-avatars\.com\/api\//i.test(raw)) {
      return raw.includes('format=') ? raw : `${raw}${raw.includes('?') ? '&' : '?'}format=png`
    }
    return raw
  }, [displayUser?.avatarUrl])

  const initials = hasUser && displayUser?.firstName && displayUser?.lastName
    ? `${displayUser.firstName[0]}${displayUser.lastName[0]}`.toUpperCase()
    : (displayUser?.email?.[0]?.toUpperCase() ?? 'U')

  const userDisplayName = hasUser
    ? (`${displayUser!.firstName ?? ''} ${displayUser!.lastName ?? ''}`.trim() || displayUser!.email)
    : ''
  const userEmail = hasUser ? displayUser!.email : ''

  // Prefetch visible routes to make sidebar navigation feel instant
  useEffect(() => {
    if (!isMounted) return
    const visibleItems = navigation.flatMap(section => section.items).filter(canSeeItem)
    visibleItems.forEach(item => {
      try {
        router.prefetch(item.href)
      } catch {
        console.warn('Sidebar prefetch failed for route', item.href)
      }
    })
  }, [isMounted, router])

  const renderNavItem = (item: (typeof navigation)[number]['items'][number]) => {
    const isActive = activeHref === item.href

    return (
      <Link
        key={item.name}
        href={item.href}
        prefetch
        className={`
          group flex items-center rounded-xl transition-all duration-200
          ${isActive
            ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20'
            : 'text-slate-400 hover:bg-white/5 hover:text-white'
          }
          w-full px-3 py-2.5 gap-3
          [.sidebar-collapsed_&]:w-10 [.sidebar-collapsed_&]:h-10 [.sidebar-collapsed_&]:justify-center [.sidebar-collapsed_&]:mx-auto [.sidebar-collapsed_&]:px-0
        `}
      >
        <item.icon className={`h-5 w-5 flex-shrink-0 transition-colors ${isActive ? 'text-white' : 'group-hover:text-white'}`} />
        <span className={`
          whitespace-nowrap font-medium text-sm transition-all duration-200 origin-left
          [.sidebar-collapsed_&]:hidden
        `}>
          {item.name}
        </span>
      </Link>
    )
  }

  // Show branding immediately if it's in the store (hydrated on server or from localStorage)
  // This prevents the flickering logo/name on refresh
  const showOrgSkeleton = !orgLoaded && !siteName && !tagline

  return (
    <aside
      className={`
        hidden md:flex relative bg-slate-900 text-white min-h-screen transition-all duration-300 flex-col z-20
        w-64 [.sidebar-collapsed_&]:w-20
      `}
    >
      {/* Header */}
      <div className={`
        relative flex items-center px-6 pr-12 border-b border-white/5 transition-all duration-300 min-w-0 gap-4
        h-20
        [.sidebar-collapsed_&]:h-32 [.sidebar-collapsed_&]:flex-col [.sidebar-collapsed_&]:justify-center [.sidebar-collapsed_&]:gap-3 [.sidebar-collapsed_&]:px-0
      `}>
        <div className={`flex items-center gap-4 transition-all duration-300 flex-1 min-w-0 [.sidebar-collapsed_&]:flex-none`}>
          {showOrgSkeleton ? (
            <>
              <div className="h-9 w-9 rounded-xl bg-slate-800 animate-pulse flex-shrink-0" />
              <div
                className={`
                  transition-all duration-300 origin-left
                  opacity-100 max-w-[200px] translate-x-0
                  [.sidebar-collapsed_&]:opacity-0 [.sidebar-collapsed_&]:max-w-0 [.sidebar-collapsed_&]:overflow-hidden [.sidebar-collapsed_&]:-translate-x-4 [.sidebar-collapsed_&]:hidden
                `}
              >
                <div className="h-4 w-24 bg-slate-800 rounded animate-pulse mb-1" />
                <div className="h-3 w-16 bg-slate-800 rounded animate-pulse" />
              </div>
            </>
          ) : (
            <>
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-900/20 flex-shrink-0 overflow-hidden">
                {logoUrl ? (
                  <div className="relative h-full w-full">
                    <Image
                      src={logoUrl}
                      alt={siteName}
                      fill
                      className="object-cover"
                      priority
                      sizes="36px"
                    />
                  </div>
                ) : (
                  <span>{shortName}</span>
                )}
              </div>
              <div
                className={`
                  transition-all duration-300 origin-left
                  opacity-100 translate-x-0 min-w-0 max-w-[160px] overflow-hidden flex-1
                  [.sidebar-collapsed_&]:opacity-0 [.sidebar-collapsed_&]:max-w-0 [.sidebar-collapsed_&]:overflow-hidden [.sidebar-collapsed_&]:-translate-x-4 [.sidebar-collapsed_&]:hidden
                `}
              >
                <p className="text-base font-bold tracking-tight text-white truncate" title={siteName}>{siteName}</p>
                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider truncate" title={tagline}>{tagline}</p>
              </div>
            </>
          )}
        </div>

        {/* Toggle Button */}
        <button
          onClick={toggle}
          className={`
            h-10 w-10 flex items-center justify-center p-1.5 rounded-lg text-slate-400 hover:bg-white/10 hover:text-white transition-all duration-200
            absolute right-4 top-1/2 -translate-y-1/2
            [.sidebar-collapsed_&]:static [.sidebar-collapsed_&]:-translate-y-0 [.sidebar-collapsed_&]:right-auto [.sidebar-collapsed_&]:mt-1
          `}
          aria-label="Toggle sidebar"
        >
          <ChevronDoubleLeftIcon className="h-5 w-5 hidden [.sidebar-collapsed_&]:block rotate-180" />
          <ChevronDoubleLeftIcon className="h-5 w-5 block [.sidebar-collapsed_&]:hidden" />
        </button>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-6 no-scrollbar">
        {navigation.map((section, sectionIndex) => {
          // Hide "My Workspace" section for Super Admin role (system admin, not an employee)
          if (section.isPersonal && isSuperAdmin) return null

          const visibleItems = section.items.filter(canSeeItem)
          if (visibleItems.length === 0) return null

          const isPersonalSection = section.isPersonal
          const isFirstAdminSection = !section.isPersonal && navigation[sectionIndex - 1]?.isPersonal

          return (
            <div key={section.label}>
              {/* Divider between personal and admin sections - only show if personal section is visible */}
              {isFirstAdminSection && !isSuperAdmin && (
                <div className="mb-6 pt-2 border-t border-white/10 [.sidebar-collapsed_&]:border-0">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500/70 px-2 mt-2 [.sidebar-collapsed_&]:hidden">
                    Administration
                  </p>
                </div>
              )}
              <p className={`
                text-[11px] font-bold uppercase tracking-wider mb-4 px-2
                [.sidebar-collapsed_&]:hidden
                ${isPersonalSection ? 'text-blue-400' : 'text-slate-500'}
              `}>
                {section.label}
              </p>
              <div className="space-y-1">
                {visibleItems.map(renderNavItem)}
              </div>
            </div>
          )
        })}
      </div>

      {/* User Profile */}
      <div className="p-4 border-t border-white/5 bg-black/20">
        <div
          className={`
            flex items-center rounded-xl p-2 transition-colors hover:bg-white/5 cursor-pointer
            gap-3 [.sidebar-collapsed_&]:justify-center
          `}
        >
          <div className="h-9 w-9 rounded-full bg-indigo-500 flex items-center justify-center font-semibold text-sm shadow-inner flex-shrink-0 border-2 border-white/10 overflow-hidden relative">
            {hasUser ? (
              avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={userDisplayName || 'User'}
                  fill
                  className="object-cover"
                  sizes="36px"
                  unoptimized
                />
              ) : (
                initials
              )
            ) : (
              <span className="h-6 w-6 rounded-full bg-slate-500/60 animate-pulse block" />
            )}
          </div>
          <div className="[.sidebar-collapsed_&]:hidden overflow-hidden min-w-0 max-w-[200px]">
            {hasUser ? (
              <>
                <p className="text-sm font-medium text-white truncate">{userDisplayName}</p>
                <p className="text-xs text-slate-400 truncate">{userEmail}</p>
              </>
            ) : (
              <div className="space-y-1">
                <div className="h-3 w-24 bg-slate-700/70 rounded animate-pulse" />
                <div className="h-2 w-20 bg-slate-700/50 rounded animate-pulse" />
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  )
}
