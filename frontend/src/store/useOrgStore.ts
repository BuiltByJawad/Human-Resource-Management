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
}

interface OrgStore extends OrgState {
  updateOrg: (updates: Partial<OrgState>) => void
}

const DEFAULTS: OrgState = {
  siteName: 'NovaHR',
  shortName: 'HR',
  tagline: 'Workspace',
  companyName: 'NovaHR Company',
  companyAddress: '123 Business Road, Tech City',
  logoUrl: null,
  faviconUrl: null,
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
      ...DEFAULTS,
      updateOrg: (updates) => {
        const current = get()
        const nextSiteName = updates.siteName ?? current.siteName
        set({
          ...current,
          ...updates,
          shortName: deriveShortName(nextSiteName, current.shortName),
        })
      },
    }),
    {
      name: 'org-config',
    }
  )
)
