import { NextFunction, Request, Response } from 'express'
import { prisma } from '../config/database'
import { BadRequestError, NotFoundError } from '../utils/errors'

export interface TenantContext {
  id: string
  slug: string | null
}

export interface TenantRequest extends Request {
  tenant?: TenantContext
}

const extractTenantSlug = (req: Request): string | null => {
  const headerSlug = req.get('x-tenant-slug')
  if (headerSlug && headerSlug.trim()) return headerSlug.trim().toLowerCase()

  const hostname = (req.hostname || '').toLowerCase()

  if (!hostname) return null
  if (hostname === 'localhost' || hostname === '127.0.0.1') return null

  const parts = hostname.split('.').filter(Boolean)
  if (parts.length < 3) return null

  const subdomain = parts[0]
  if (!subdomain || subdomain === 'www') return null

  return subdomain
}

export const resolveTenant = async (req: TenantRequest, _res: Response, next: NextFunction) => {
  try {
    const slug = extractTenantSlug(req)

    if (!slug) {
      if (process.env.REQUIRE_TENANT === 'true') {
        throw new BadRequestError('Tenant not specified')
      }
      return next()
    }

    const org = await prisma.organization.findFirst({
      where: { slug },
    })

    if (!org) {
      throw new NotFoundError('Organization')
    }

    req.tenant = { id: org.id, slug: org.slug }
    return next()
  } catch (err) {
    return next(err)
  }
}
