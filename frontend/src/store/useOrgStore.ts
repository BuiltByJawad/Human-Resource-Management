import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { buildTenantStorageKey, getClientTenantSlug } from '@/lib/tenant'

interface OrgState {
  siteName: string
  shortName: string
  tagline: string
  companyName: string
  companyAddress: string
  logoUrl: string | null
  faviconUrl: string | null
  loaded: boolean
}

interface OrgStore extends OrgState {
  updateOrg: (updates: Partial<OrgState>) => void
  setLoaded: (loaded: boolean) => void
}

const ORG_STORAGE_KEY = 'org-config'

const resolveTenantKey = (baseKey: string) => {
  if (typeof window === 'undefined') return baseKey
  return buildTenantStorageKey(baseKey, getClientTenantSlug())
}

const DEFAULTS: OrgState = {
  siteName: '',
  shortName: 'HR',
  tagline: '',
  companyName: '',
  companyAddress: '',
  logoUrl: null,
  faviconUrl: null,
  // Start false to avoid SSR/CSR mismatch; set true after rehydrate
  loaded: false,
}

const getInitialState = (): OrgState => {
  if (typeof window === 'undefined') return DEFAULTS
  try {
    const storage = window.localStorage
    const tenantKey = resolveTenantKey(ORG_STORAGE_KEY)
    const raw = storage.getItem(tenantKey)
    if (raw) {
      const parsed = JSON.parse(raw)?.state as Partial<OrgState> | undefined
      if (parsed) {
        const siteName = parsed.siteName ?? DEFAULTS.siteName
        return {
          ...DEFAULTS,
          ...parsed,
          shortName: deriveShortName(siteName, parsed.shortName ?? DEFAULTS.shortName),
          loaded: true,
        }
      }
    }

    const tenantSlug = getClientTenantSlug()
    if (!tenantSlug && tenantKey !== ORG_STORAGE_KEY) {
      const legacyRaw = storage.getItem(ORG_STORAGE_KEY)
      if (legacyRaw) {
        storage.setItem(tenantKey, legacyRaw)
        storage.removeItem(ORG_STORAGE_KEY)

        const parsed = JSON.parse(legacyRaw)?.state as Partial<OrgState> | undefined
        if (parsed) {
          const siteName = parsed.siteName ?? DEFAULTS.siteName
          return {
            ...DEFAULTS,
            ...parsed,
            shortName: deriveShortName(siteName, parsed.shortName ?? DEFAULTS.shortName),
            loaded: true,
          }
        }
      }
    }
  } catch {
    // ignore
  }
  return DEFAULTS
}

const orgPersistStorage = {
  getItem: (name: string) => {
    if (typeof window === 'undefined') return null
    try {
      const tenantKey = resolveTenantKey(name)
      const value = window.localStorage.getItem(tenantKey)
      if (value) return value

      const tenantSlug = getClientTenantSlug()
      if (!tenantSlug && tenantKey !== name) {
        const legacy = window.localStorage.getItem(name)
        if (legacy) {
          window.localStorage.setItem(tenantKey, legacy)
          window.localStorage.removeItem(name)
          return legacy
        }
      }
    } catch {
    }
    return null
  },
  setItem: (name: string, value: string) => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(resolveTenantKey(name), value)
    } catch {
    }
  },
  removeItem: (name: string) => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.removeItem(resolveTenantKey(name))
    } catch {
    }

    const tenantSlug = getClientTenantSlug()
    if (!tenantSlug) {
      try {
        window.localStorage.removeItem(name)
      } catch {
      }
    }
  },
}

function deriveShortName(name: string | null | undefined, fallback: string): string {
  if (!name) return fallback
  const letters = name
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0]?.toUpperCase())
    .join('')
  return letters || fallback
}

export const useOrgStore = create<OrgStore>()(
  persist(
    (set, get) => ({
      ...getInitialState(),
      updateOrg: (updates) => {
        const current = get()
        const nextSiteName = updates.siteName ?? current.siteName
        set({
          ...current,
          ...updates,
          shortName: deriveShortName(nextSiteName, current.shortName),
        })
      },
      setLoaded: (loaded) => set((state) => ({ ...state, loaded })),
    }),
    {
      name: ORG_STORAGE_KEY,
      storage: createJSONStorage(() => orgPersistStorage),
      onRehydrateStorage: () => (state, error) => {
        if (state && !error) {
          // derive shortName after hydration to keep server/client markup aligned
          state.updateOrg({ siteName: state.siteName })
          state.setLoaded(true)
        }
      },
    }
  )
)
