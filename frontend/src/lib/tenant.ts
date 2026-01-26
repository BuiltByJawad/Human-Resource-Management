export const TENANT_OVERRIDE_KEY = 'tenant-slug-override'

export const extractTenantSlug = (_args: {
  headerSlug?: string | null
  hostname?: string | null
}) => null

export const getClientTenantSlug = () => null

export const buildTenantStorageKey = (baseKey: string, _tenantSlug?: string | null) => baseKey
