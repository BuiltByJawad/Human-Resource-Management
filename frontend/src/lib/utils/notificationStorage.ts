import { buildTenantStorageKey, getClientTenantSlug } from '@/lib/tenant'

const LEGACY_LOCAL_KEY = 'hrm:notificationUnreadCount'
const LEGACY_SESSION_KEY = 'ui:lastUnreadCount'

export const readTenantUnreadCount = (): number => {
  if (typeof window === 'undefined') return 0

  const tenantKey = buildTenantStorageKey('notification-unread-count', getClientTenantSlug())
  const rawTenantLocal = window.localStorage.getItem(tenantKey)
  const rawTenantSession = window.sessionStorage.getItem(tenantKey)
  const rawLegacyLocal = window.localStorage.getItem(LEGACY_LOCAL_KEY)
  const rawLegacySession = window.sessionStorage.getItem(LEGACY_SESSION_KEY)
  const candidate = rawTenantLocal ?? rawTenantSession ?? rawLegacyLocal ?? rawLegacySession
  const parsed = candidate ? Number(candidate) : 0

  if (!Number.isFinite(parsed) || parsed < 0) return 0

  if (rawTenantLocal == null && rawTenantSession == null) {
    window.localStorage.setItem(tenantKey, String(parsed))
    window.sessionStorage.setItem(tenantKey, String(parsed))
  }

  if (rawLegacyLocal == null && rawLegacySession != null) {
    window.localStorage.setItem(LEGACY_LOCAL_KEY, String(parsed))
  }

  return parsed
}

export const writeTenantUnreadCount = (count: number) => {
  if (typeof window === 'undefined') return
  if (!Number.isFinite(count) || count < 0) return

  const tenantKey = buildTenantStorageKey('notification-unread-count', getClientTenantSlug())
  const value = String(count)
  window.localStorage.setItem(tenantKey, value)
  window.sessionStorage.setItem(tenantKey, value)
  window.localStorage.setItem(LEGACY_LOCAL_KEY, value)
  window.sessionStorage.setItem(LEGACY_SESSION_KEY, value)
}
