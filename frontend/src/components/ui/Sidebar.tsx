'use client'
import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useBranding } from '@/components/providers/BrandingProvider'
import { useAuthStore } from '@/store/useAuthStore'
import { useBrandingStore } from '@/store/useBrandingStore'
import { useInitialAuth } from '@/components/providers/AuthBootstrapProvider'
import { ChevronDoubleLeftIcon } from '@heroicons/react/24/outline'
import { navigation, type NavItem } from './Sidebar.config'
import { readCachedUser, ensurePngAvatar, getActiveHref } from './Sidebar.helpers'

// ─── Component ────────────────────────────────────────────────────────────────

export default function Sidebar() {

  const router   = useRouter()
  const pathname = usePathname()

  // Branding
  const branding      = useBranding()
  const brandingStore = useBrandingStore()
  const siteName  = branding?.siteName  || brandingStore.siteName
  const shortName = branding?.shortName || brandingStore.shortName
  const tagline   = branding?.tagline   || brandingStore.tagline
  const logoUrl   = branding?.logoUrl   || brandingStore.logoUrl

  // Auth
  const storeUser   = useAuthStore(s => s.user)
  const initialAuth = useInitialAuth()
  const cachedUser  = useMemo(() => readCachedUser(), [])
  const user        = (initialAuth?.user ?? storeUser ?? cachedUser) as any

  // Collapse state — read from DOM class (set by layout script before React runs)
  const [isCollapsed, setIsCollapsed] = useState(false)
  useEffect(() => {
    setIsCollapsed(document.documentElement.classList.contains('sidebar-collapsed'))
  }, [])

  const toggleCollapse = () => {
    setIsCollapsed(prev => {
      const next = !prev
      localStorage.setItem('sidebarCollapsed', String(next))
      document.documentElement.classList.toggle('sidebar-collapsed', next)
      return next
    })
  }

  // Permissions
  const [permissionsReady, setPermissionsReady] = useState(false)
  useEffect(() => {
    if ((user?.permissions?.length ?? 0) > 0 || (cachedUser?.permissions?.length ?? 0) > 0) {
      setPermissionsReady(true)
    }
  }, [user, cachedUser])

  const isSuperAdmin  = user?.role === 'Super Admin'
  const permissions: string[] = user?.permissions ?? cachedUser?.permissions ?? []

  const canSee = (item: NavItem): boolean => {
    if (!permissionsReady) return true // show all during SSR to avoid hydration mismatch
    if (item.requiresEmployeeProfile) return !!(user?.employee?.id ?? cachedUser?.employee?.id)
    if (!item.permissions?.length)    return true
    if (isSuperAdmin)                 return true
    return item.permissions.some(p => permissions.includes(p))
  }

  // Active route
  const activeHref = getActiveHref(pathname, navigation.flatMap(section => section.items))

  // User display info
  const avatarUrl      = useMemo(() => ensurePngAvatar(user?.avatarUrl ?? null), [user?.avatarUrl])
  const initials       = user?.firstName && user?.lastName
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : (user?.email?.[0]?.toUpperCase() ?? 'U')
  const displayName    = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim() || user?.email || ''
  const footerYear     = new Date().getFullYear()

  // Prefetch visible routes
  useEffect(() => {
    navigation
      .flatMap(s => s.items)
      .filter(canSee)
      .forEach(item => {
        try { router.prefetch(item.href) } catch { /* ignore */ }
      })
  }, [router]) // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Sub-components ─────────────────────────────────────────────────────────

  const NavLink = ({ item }: { item: NavItem }) => {
    const accessible = canSee(item)
    const isActive   = activeHref === item.href

    if (!accessible) {
      return (
        <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 opacity-40 grayscale pointer-events-none w-full [.sidebar-collapsed_&]:w-10 [.sidebar-collapsed_&]:h-10 [.sidebar-collapsed_&]:justify-center [.sidebar-collapsed_&]:mx-auto [.sidebar-collapsed_&]:px-0">
          <item.icon className="h-5 w-5 flex-shrink-0 text-slate-600" />
          <span className="text-sm font-medium text-slate-600 whitespace-nowrap [.sidebar-collapsed_&]:hidden">{item.name}</span>
        </div>
      )
    }

    return (
      <Link
        href={item.href}
        prefetch
        className={`
          group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200
          w-full [.sidebar-collapsed_&]:w-10 [.sidebar-collapsed_&]:h-10 [.sidebar-collapsed_&]:justify-center [.sidebar-collapsed_&]:mx-auto [.sidebar-collapsed_&]:px-0
          ${isActive
            ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20'
            : 'text-slate-400 hover:bg-white/5 hover:text-white'}
        `}
      >
        <item.icon className={`h-5 w-5 flex-shrink-0 ${isActive ? 'text-white' : 'group-hover:text-white'}`} />
        <span className="text-sm font-medium whitespace-nowrap [.sidebar-collapsed_&]:hidden">{item.name}</span>
      </Link>
    )
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <aside className="hidden md:flex flex-col relative bg-slate-900 text-white h-screen flex-shrink-0 z-20 transition-all duration-300 w-64 [.sidebar-collapsed_&]:w-20">

      {/* ── Header ── */}
      <div className="relative flex items-center h-20 px-6 pr-12 border-b border-white/5 gap-4 [.sidebar-collapsed_&]:h-32 [.sidebar-collapsed_&]:flex-col [.sidebar-collapsed_&]:justify-center [.sidebar-collapsed_&]:gap-3 [.sidebar-collapsed_&]:px-0">
        
        {/* Logo + site name */}
        <div className="flex items-center gap-4 flex-1 min-w-0 mr-2 [.sidebar-collapsed_&]:flex-none [.sidebar-collapsed_&]:mr-0">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-900/20 flex-shrink-0 overflow-hidden">
            {logoUrl
              ? <div className="relative h-full w-full"><Image src={logoUrl} alt={siteName} fill className="object-cover" priority sizes="36px" /></div>
              : <span>{shortName}</span>
            }
          </div>
          <div className="transition-all duration-300 origin-left min-w-0 max-w-[140px] [.sidebar-collapsed_&]:hidden">
            <p className="text-base font-bold tracking-tight text-white truncate" title={siteName}>{siteName}</p>
            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider truncate" title={tagline}>{tagline}</p>
          </div>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={toggleCollapse}
          className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 flex items-center justify-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white transition-colors [.sidebar-collapsed_&]:static [.sidebar-collapsed_&]:translate-y-0"
          aria-label="Toggle sidebar"
        >
          <ChevronDoubleLeftIcon className={`h-5 w-5 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-6 no-scrollbar">
        {navigation.map((section, i) => {
          // Super admins aren't employees — hide personal section for them
          if (section.isPersonal && isSuperAdmin) return null

          const isFirstAdminSection = !section.isPersonal && navigation[i - 1]?.isPersonal

          return (
            <div key={section.label}>
              {/* Divider before first admin section */}
              {isFirstAdminSection && !isSuperAdmin && (
                <div className="mb-6 pt-2 border-t border-white/10 [.sidebar-collapsed_&]:border-0">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500/70 px-2 mt-2 [.sidebar-collapsed_&]:hidden">
                    Administration
                  </p>
                </div>
              )}

              <p className={`text-[11px] font-bold uppercase tracking-wider mb-4 px-2 [.sidebar-collapsed_&]:hidden ${section.isPersonal ? 'text-blue-400' : 'text-slate-500'}`}>
                {section.label}
              </p>

              <div className="space-y-1">
                {section.items.map(item => <NavLink key={item.name} item={item} />)}
              </div>
            </div>
          )
        })}
      </nav>

      {/* ── User profile ── */}
      <div className="p-4 border-t border-white/5 bg-black/20">
        <button
          onClick={() => router.push('/profile')}
          className="flex items-center gap-3 w-full rounded-xl p-2 hover:bg-white/5 transition-colors [.sidebar-collapsed_&]:justify-center"
        >
          {/* Avatar */}
          <div className="h-9 w-9 rounded-full bg-indigo-500 flex items-center justify-center font-semibold text-sm border-2 border-white/10 overflow-hidden relative flex-shrink-0">
            {user ? (
              avatarUrl
                ? <Image src={avatarUrl} alt={displayName || 'User'} fill className="object-cover" sizes="36px" unoptimized />
                : initials
            ) : (
              <span className="h-6 w-6 rounded-full bg-slate-500/60 animate-pulse block" />
            )}
          </div>

          {/* Name + email */}
          <div className="[.sidebar-collapsed_&]:hidden overflow-hidden min-w-0">
            {user ? (
              <>
                <p className="text-sm font-medium text-white truncate">{displayName}</p>
                <p className="text-xs text-slate-400 truncate">{user.email}</p>
              </>
            ) : (
              <div className="space-y-1">
                <div className="h-3 w-24 bg-slate-700/70 rounded animate-pulse" />
                <div className="h-2 w-20 bg-slate-700/50 rounded animate-pulse" />
              </div>
            )}
          </div>
        </button>

        {/* Footer links */}
        <div className="mt-3 pt-3 border-t border-white/5 text-[11px] text-slate-400 space-y-2 [.sidebar-collapsed_&]:hidden">
          <span className="tracking-tight">© {footerYear} {siteName || 'HRM Platform'}</span>
          <div className="flex items-center gap-3">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <span className="text-slate-600">•</span>
            <Link href="/terms"   className="hover:text-white transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </aside>
  )
}