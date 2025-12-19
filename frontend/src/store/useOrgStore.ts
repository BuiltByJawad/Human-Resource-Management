import { create } from 'zustand'
import { persist } from 'zustand/middleware'

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
    const raw = localStorage.getItem('org-config')
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
  } catch {
    // ignore
  }
  return DEFAULTS
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
      name: 'org-config',
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
