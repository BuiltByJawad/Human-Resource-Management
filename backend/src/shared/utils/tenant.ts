import { AuthRequest } from '../middleware/auth'
import { TenantRequest } from '../middleware/tenant'
import { BadRequestError, UnauthorizedError } from './errors'

export const getRequestOrganizationId = (req: AuthRequest & TenantRequest) => {
  const tokenOrgId = req.user?.organizationId ?? null
  const tenantOrgId = req.tenant?.id ?? null

  if (tokenOrgId && tenantOrgId && tokenOrgId !== tenantOrgId) {
    throw new UnauthorizedError('Invalid token (organization mismatch)')
  }

  return tokenOrgId || tenantOrgId
}

export const requireRequestOrganizationId = (req: AuthRequest & TenantRequest) => {
  const organizationId = getRequestOrganizationId(req)
  if (!organizationId) {
    throw new BadRequestError('Tenant not specified')
  }
  return organizationId
}
