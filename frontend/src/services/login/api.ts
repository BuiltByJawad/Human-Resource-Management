import { headers } from 'next/headers'
import type { LoginBranding } from '@/services/login/types'
import { buildHighlights, deriveHeroTitle, FALLBACK_BRANDING } from '@/services/login/branding'

const normalizeAssetUrl = (url: unknown, apiBase: string): string | null => {
  if (typeof url !== 'string') return null
  const trimmed = url.trim()
  if (!trimmed) return null
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed
  if (trimmed.startsWith('//')) return `https:${trimmed}`
  if (trimmed.startsWith('/')) return `${apiBase}${trimmed}`
  return `${apiBase}/${trimmed}`
}

export async function fetchLoginBranding(): Promise<LoginBranding> {
  const apiBase =
    process.env.BACKEND_URL ||
    (process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api$/, '') : null) ||
    'http://localhost:5000'

  try {
    const response = await fetch(`${apiBase}/api/org/branding/public`, {
      cache: 'no-store',
    })

    if (!response.ok) {
      return FALLBACK_BRANDING
    }

    const payload = await response.json().catch(() => null)
    const data = payload?.data ?? payload
    if (!data) {
      return FALLBACK_BRANDING
    }

    const rawLogoUrl = data.logoUrl ?? data.logo ?? null
    const rawFaviconUrl = data.faviconUrl ?? data.favicon ?? null

    return {
      siteName: data.siteName || FALLBACK_BRANDING.siteName,
      tagline: data.tagline || FALLBACK_BRANDING.tagline,
      heroTitle: deriveHeroTitle(data.siteName),
      heroSubtitle: data.tagline || data.companyName || FALLBACK_BRANDING.heroSubtitle,
      highlights: buildHighlights({
        tagline: data.tagline,
        companyName: data.companyName,
        companyAddress: data.companyAddress,
      }),
      logoUrl: normalizeAssetUrl(rawLogoUrl, apiBase),
      faviconUrl: normalizeAssetUrl(rawFaviconUrl, apiBase),
      companyName: data.companyName,
      companyAddress: data.companyAddress,
    }
  } catch {
    return FALLBACK_BRANDING
  }
}
