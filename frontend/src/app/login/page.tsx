import LoginClient, { LoginBranding, LoginHighlight } from './LoginClient'

const FALLBACK_HIGHLIGHTS: LoginHighlight[] = [
  {
    title: 'Unified HR operations',
    description: 'Manage employees, payroll, leaves and performance from a single hub.'
  },
  {
    title: 'Enterprise-grade security',
    description: 'Single sign-on ready with full audit trails and SOC aligned controls.'
  },
  {
    title: 'Real-time insights',
    description: 'Live dashboards help HR partners respond faster to workforce changes.'
  }
]

const FALLBACK_BRANDING: LoginBranding = {
  siteName: 'Nimbus HR',
  tagline: 'Modern HR infrastructure for growing teams',
  heroTitle: 'Welcome back',
  heroSubtitle: 'Securely access your organization workspace',
  highlights: FALLBACK_HIGHLIGHTS,
  logoUrl: null,
  companyName: 'Nimbus HR',
  companyAddress: 'Global HQ'
}

function deriveHeroTitle(siteName?: string | null, fallback = FALLBACK_BRANDING.heroTitle) {
  if (!siteName) return fallback
  return `Welcome back to ${siteName}`
}

function buildHighlights(data: any): LoginHighlight[] {
  const highlights: LoginHighlight[] = []
  if (data?.tagline) {
    highlights.push({
      title: 'Why teams choose us',
      description: data.tagline
    })
  }

  if (data?.companyName) {
    highlights.push({
      title: data.companyName,
      description: data?.companyAddress || 'People operations HQ'
    })
  }

  if (highlights.length === 0) {
    return FALLBACK_HIGHLIGHTS
  }

  return highlights
}

async function fetchBranding(): Promise<LoginBranding> {
  const apiBase =
    process.env.BACKEND_URL ||
    (process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api$/, '') : null) ||
    'http://localhost:5000'

  try {
    const response = await fetch(`${apiBase}/api/organization/branding/public`, {
      cache: 'no-store'
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
      highlights: buildHighlights(data),
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
