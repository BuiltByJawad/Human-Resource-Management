export type LoginHighlight = {
  title: string
  description: string
}

export interface LoginBranding {
  siteName: string
  tagline?: string | null
  heroTitle: string
  heroSubtitle: string
  highlights: LoginHighlight[]
  logoUrl?: string | null
  faviconUrl?: string | null
  companyName?: string | null
  companyAddress?: string | null
}
