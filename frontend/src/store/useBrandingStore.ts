import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

interface BrandingState {
  siteName: string
  shortName: string
  tagline: string
  companyName: string
  companyAddress: string
  logoUrl: string | null
  faviconUrl: string | null
  footerYear: number | null
  loaded: boolean
}

interface BrandingStore extends BrandingState {
  updateBranding: (updates: Partial<BrandingState>) => void
  setLoaded: (loaded: boolean) => void
}

const BRANDING_STORAGE_KEY = 'branding-config'

const DEFAULTS: BrandingState = {
  siteName: '',
  shortName: 'HR',
  tagline: '',
  companyName: '',
  companyAddress: '',
  logoUrl: null,
  faviconUrl: null,
  footerYear: null,
  // Start false to avoid SSR/CSR mismatch; set true after rehydrate
  loaded: false,
}

const getInitialState = (): BrandingState => {
  // IMPORTANT: Initial branding state must be identical on the server and on the
  // first client render to avoid hydration mismatches. We rely on the
  // BrandingProvider (server-fetched) for SSR values and let the persist
  // middleware rehydrate from localStorage *after* mount via onRehydrateStorage.
  // So we intentionally do NOT read from localStorage here.
  return DEFAULTS
}

const brandingPersistStorage = {
  getItem: (name: string) => {
    if (typeof window === 'undefined') return null
    try {
      const value = window.localStorage.getItem(name)
      if (value) return value

      return null
    } catch {
    }
    return null
  },
  setItem: (name: string, value: string) => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(name, value)
    } catch {
    }
  },
  removeItem: (name: string) => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.removeItem(name)
    } catch {
    }

    try {
      window.localStorage.removeItem(name)
    } catch {
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

export const useBrandingStore = create<BrandingStore>()(
  persist(
    (set, get) => ({
      ...getInitialState(),
      updateBranding: (updates) => {
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
      name: BRANDING_STORAGE_KEY,
      storage: createJSONStorage(() => brandingPersistStorage),
      partialize: (state) => {
        const { faviconUrl, ...rest } = state
        return rest
      },
      onRehydrateStorage: () => (state, error) => {
        if (state && !error) {
          state.updateBranding({ siteName: state.siteName, faviconUrl: null })
          state.setLoaded(true)
        }
      },
    }
  )
)
