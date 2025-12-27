export const TENANT_OVERRIDE_KEY = 'tenant-slug-override'

const normalizeSlug = (value: string) => value.trim().toLowerCase()

export const extractTenantSlug = (args: {
  headerSlug?: string | null
  hostname?: string | null
}) => {
  const headerSlug = args.headerSlug
  if (headerSlug && headerSlug.trim()) {
    return normalizeSlug(headerSlug)
  }

  const hostname = (args.hostname || '').toLowerCase().split(':')[0]
  if (!hostname) return null

  if (hostname === 'localhost' || hostname === '127.0.0.1') return null

  const parts = hostname.split('.').filter(Boolean)
  if (parts.length < 3) return null

  const subdomain = parts[0]
  if (!subdomain || subdomain === 'www') return null

  return normalizeSlug(subdomain)
}

export const getClientTenantSlug = () => {
  if (typeof window === 'undefined') return null

  try {
    const override = window.localStorage.getItem(TENANT_OVERRIDE_KEY)
    if (override && override.trim()) {
      return normalizeSlug(override)
    }
  } catch {
  }

  return extractTenantSlug({ hostname: window.location?.hostname })
}

export const buildTenantStorageKey = (baseKey: string, tenantSlug?: string | null) => {
  const slug = tenantSlug && tenantSlug.trim() ? tenantSlug.trim().toLowerCase() : 'public'
  return `${baseKey}:${slug}`
}
