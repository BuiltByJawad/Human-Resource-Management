import LoginClient from './LoginClient'
import { FALLBACK_BRANDING, buildHighlights, deriveHeroTitle, LoginBranding } from './branding'
import { headers } from 'next/headers'
import { extractTenantSlug } from '@/lib/tenant'

async function fetchBranding(): Promise<LoginBranding> {
  const apiBase =
    process.env.BACKEND_URL ||
    (process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api$/, '') : null) ||
    'http://localhost:5000'

  const headerList = await headers()
  const tenantSlug = extractTenantSlug({
    headerSlug: headerList.get('x-tenant-slug'),
    hostname: headerList.get('host'),
  })

  try {
    const response = await fetch(`${apiBase}/api/org/branding/public`, {
      cache: 'no-store',
      headers: {
        ...(tenantSlug ? { 'X-Tenant-Slug': tenantSlug } : {}),
      },
    })

    if (!response.ok) {
      return FALLBACK_BRANDING
    }

    const payload = await response.json().catch(() => null)
    const data = payload?.data ?? payload
    if (!data) {
      return FALLBACK_BRANDING
    }

    return {
      siteName: data.siteName || FALLBACK_BRANDING.siteName,
      tagline: data.tagline || FALLBACK_BRANDING.tagline,
      heroTitle: deriveHeroTitle(data.siteName),
      heroSubtitle: data.tagline || data.companyName || FALLBACK_BRANDING.heroSubtitle,
      highlights: buildHighlights({
        tagline: data.tagline,
        companyName: data.companyName,
        companyAddress: data.companyAddress
      }),
      logoUrl: data.logoUrl ?? null,
      companyName: data.companyName,
      companyAddress: data.companyAddress
    }
  } catch {
    return FALLBACK_BRANDING
  }
}

export default async function LoginPage() {
  const branding = await fetchBranding()
  return <LoginClient branding={branding} />
}
