import { LoginBranding, LoginHighlight } from '@/features/auth/types/auth.types';

export const FALLBACK_HIGHLIGHTS: LoginHighlight[] = [
  {
    title: 'Unified HR operations',
    description: 'Manage employees, payroll, leaves and performance from a single hub.',
  },
  {
    title: 'Enterprise-grade security',
    description: 'Single sign-on ready with full audit trails and SOC aligned controls.',
  },
  {
    title: 'Real-time insights',
    description: 'Live dashboards help HR partners respond faster to workforce changes.',
  },
];

export const FALLBACK_BRANDING: LoginBranding = {
  siteName: 'Nimbus HR',
  tagline: 'Modern HR infrastructure for growing teams',
  heroTitle: 'Welcome back',
  heroSubtitle: 'Securely access your organization workspace',
  highlights: FALLBACK_HIGHLIGHTS,
  logoUrl: null,
  faviconUrl: null,
  companyName: 'Nimbus HR',
  companyAddress: 'Global HQ',
};

export function deriveHeroTitle(siteName?: string | null, fallback = FALLBACK_BRANDING.heroTitle) {
  if (!siteName) return fallback;
  return `Welcome back to ${siteName}`;
}

type HighlightSource = {
  tagline?: string | null;
  companyName?: string | null;
  companyAddress?: string | null;
};

export function buildHighlights(
  source?: HighlightSource,
  fallback: LoginHighlight[] = FALLBACK_HIGHLIGHTS,
): LoginHighlight[] {
  if (!source) {
    return fallback;
  }

  const highlights: LoginHighlight[] = [];

  if (source.tagline) {
    highlights.push({
      title: 'Why teams choose us',
      description: source.tagline,
    });
  }

  if (source.companyName) {
    highlights.push({
      title: source.companyName,
      description: source.companyAddress || 'People operations HQ',
    });
  }

  if (highlights.length === 0) {
    return fallback;
  }

  return highlights;
}
