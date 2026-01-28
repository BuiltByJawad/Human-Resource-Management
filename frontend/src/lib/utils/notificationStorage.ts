const LEGACY_LOCAL_KEY = 'hrm:notificationUnreadCount'
const LEGACY_SESSION_KEY = 'ui:lastUnreadCount'
const UNREAD_COUNT_KEY = 'notification-unread-count'

export const readUnreadCount = (): number => {
  if (typeof window === 'undefined') return 0

  const rawLocal = window.localStorage.getItem(UNREAD_COUNT_KEY)
  const rawSession = window.sessionStorage.getItem(UNREAD_COUNT_KEY)
  const rawLegacyLocal = window.localStorage.getItem(LEGACY_LOCAL_KEY)
  const rawLegacySession = window.sessionStorage.getItem(LEGACY_SESSION_KEY)
  const candidate = rawLocal ?? rawSession ?? rawLegacyLocal ?? rawLegacySession
  const parsed = candidate ? Number(candidate) : 0

  if (!Number.isFinite(parsed) || parsed < 0) return 0

  if (rawLocal == null && rawSession == null) {
    window.localStorage.setItem(UNREAD_COUNT_KEY, String(parsed))
    window.sessionStorage.setItem(UNREAD_COUNT_KEY, String(parsed))
  }

  if (rawLegacyLocal == null && rawLegacySession != null) {
    window.localStorage.setItem(LEGACY_LOCAL_KEY, String(parsed))
  }

  return parsed
}

export const writeUnreadCount = (count: number) => {
  if (typeof window === 'undefined') return
  if (!Number.isFinite(count) || count < 0) return

  const value = String(count)
  window.localStorage.setItem(UNREAD_COUNT_KEY, value)
  window.sessionStorage.setItem(UNREAD_COUNT_KEY, value)
  window.localStorage.setItem(LEGACY_LOCAL_KEY, value)
  window.sessionStorage.setItem(LEGACY_SESSION_KEY, value)
}
