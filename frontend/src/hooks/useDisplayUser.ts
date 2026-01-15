'use client'

import { useMemo } from 'react'
import { buildTenantStorageKey, getClientTenantSlug } from '@/lib/tenant'
import { useAuthStore } from '@/store/useAuthStore'
import { useInitialAuth } from '@/components/providers/AuthBootstrapProvider'

type DisplayUser = {
  id?: string
  email?: string
  firstName?: string | null
  lastName?: string | null
  role?: string
  avatarUrl?: string | null
}

const parseCachedUser = (raw: string | null): DisplayUser | null => {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as { state?: { user?: unknown }; user?: unknown }
    const state = parsed?.state ?? parsed
    const user = state?.user as Record<string, unknown> | undefined
    if (!user || typeof user !== 'object') return null
    return {
      id: typeof user.id === 'string' ? user.id : undefined,
      email: typeof user.email === 'string' ? user.email : undefined,
      firstName: typeof user.firstName === 'string' ? user.firstName : null,
      lastName: typeof user.lastName === 'string' ? user.lastName : null,
      role: typeof user.role === 'string' ? user.role : undefined,
      avatarUrl: typeof user.avatarUrl === 'string' ? user.avatarUrl : null,
    }
  } catch {
    return null
  }
}

export function useDisplayUser() {
  const initialAuth = useInitialAuth()
  const { user } = useAuthStore()

  const cachedUser = useMemo(() => {
    if (typeof window === 'undefined') return null
    const tenantKey = buildTenantStorageKey('auth-storage', getClientTenantSlug())
    const local = parseCachedUser(window.localStorage.getItem(tenantKey))
    if (local) return local
    const session = parseCachedUser(window.sessionStorage.getItem(tenantKey))
    if (session) return session
    return parseCachedUser(window.localStorage.getItem('auth-storage'))
  }, [])

  const effectiveUser = (initialAuth?.user ?? user) as DisplayUser | undefined
  const displayUser = effectiveUser ?? cachedUser

  return { initialAuth, effectiveUser, displayUser }
}
