import type { NavItem } from './Sidebar.config'

export interface CachedUser {
  id?: string
  email?: string
  firstName: string | null
  lastName: string | null
  avatarUrl: string | null
  role: string | null
  employee: Record<string, unknown> | null | undefined
  permissions: string[]
}

export function readCachedUser(): CachedUser | null {
  if (typeof window === 'undefined') return null

  const parse = (raw: string | null): CachedUser | null => {
    if (!raw) return null
    try {
      const parsed = JSON.parse(raw) as { state?: Record<string, unknown> }
      const state = (parsed?.state ?? parsed) as Record<string, unknown>
      const u = state?.user as Record<string, unknown> | undefined
      if (!u) return null
      return {
        id:          typeof u.id          === 'string' ? u.id          : undefined,
        email:       typeof u.email       === 'string' ? u.email       : undefined,
        firstName:   typeof u.firstName   === 'string' ? u.firstName   : null,
        lastName:    typeof u.lastName    === 'string' ? u.lastName    : null,
        avatarUrl:   typeof u.avatarUrl   === 'string' ? u.avatarUrl   : null,
        role:        typeof u.role        === 'string' ? u.role        : null,
        employee:    u.employee as CachedUser['employee'],
        permissions: Array.isArray(state.permissions)
          ? (state.permissions as string[])
          : (Array.isArray((u as any).permissions) ? (u as any).permissions : []),
      }
    } catch {
      return null
    }
  }

  return (
    parse(localStorage.getItem('auth-storage')) ??
    parse(sessionStorage.getItem('auth-storage'))
  )
}

export function ensurePngAvatar(url: string | null): string | null {
  if (!url) return null
  if (/ui-avatars\.com\/api\//i.test(url)) {
    return url.includes('format=') ? url : `${url}${url.includes('?') ? '&' : '?'}format=png`
  }
  return url
}

export function getActiveHref(pathname: string, allItems: NavItem[]): string | null {
  const matches = allItems
    .map(i => i.href)
    .filter(h => pathname === h || pathname.startsWith(`${h}/`))
  return matches.sort((a, b) => b.length - a.length)[0] ?? null
}
