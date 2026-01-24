import { Request, Response } from 'express'
import { asyncHandler } from '@/shared/middleware/errorHandler'
import { BadRequestError } from '@/shared/utils/errors'
import { AuthRequest } from '@/shared/middleware/auth'
import { createAuditLog } from '@/shared/utils/audit'
import { prisma } from '@/shared/config/database'
import cloudinary from '@/shared/config/cloudinary'
import { TenantRequest } from '@/shared/middleware/tenant'
import { Prisma } from '@prisma/client'
import Joi from 'joi'

// Helper to get full URL for uploads (supports Cloudinary + local disk)
const getFileUrl = (req: Request, file: any) => {
  // Cloudinary or other remote storages often expose path/url/secure_url
  const remoteUrl = file?.path || file?.secure_url || file?.url
  if (remoteUrl && (remoteUrl.startsWith('http://') || remoteUrl.startsWith('https://'))) {
    return remoteUrl
  }
  // Local upload fallback
  const protocol = req.protocol
  const host = req.get('host')
  const filename = file?.filename || file?.path || file?.originalname
  return `${protocol}://${host}/uploads/${filename}`
}

const extractPublicId = (url?: string | null) => {
  if (!url) return null
  try {
    // Example: https://res.cloudinary.com/<cloud>/image/upload/v12345/folder/name.png
    const withoutParams = url.split('?')[0]
    const parts = withoutParams.split('/upload/')[1]
    if (!parts) return null
    const pathParts = parts.split('/')
    // remove version segment if present (starts with v<digits>)
    const filtered = pathParts.filter((p, idx) => !(idx === 0 && /^v\d+/.test(p)))
    const filename = filtered.pop()
    if (!filename) return null
    const withoutExt = filename.replace(/\.[^/.]+$/, '')
    const folder = filtered.join('/')
    return folder ? `${folder}/${withoutExt}` : withoutExt
  } catch {
    return null
  }
}

const deleteFromCloudinaryIfPossible = async (url?: string | null) => {
  const publicId = extractPublicId(url || undefined)
  if (publicId && cloudinary.config().cloud_name) {
    try {
      await cloudinary.uploader.destroy(publicId)
    } catch (e) {
      // swallow delete errors to avoid blocking the request
    }
  }
}

const normalizeHighlights = (value: any) => {
  if (!value) return []
  const list = Array.isArray(value) ? value : []
  return list
    .map((item) => ({
      title: typeof item?.title === 'string' ? item.title : '',
      description: typeof item?.description === 'string' ? item.description : ''
    }))
    .filter((item) => item.title?.trim() || item.description?.trim())
}

const ensureSettings = async (organizationId?: string | null) => {
  let settings = await prisma.companySettings.findFirst({
    where: { organizationId: organizationId ?? null },
  })

  if (!settings) {
    settings = await prisma.companySettings.create({
      data: { organizationId: organizationId ?? null },
    })
  }

  return settings
}

const ensureOrganization = async (organizationId?: string | null) => {
  if (!organizationId) {
    throw new BadRequestError('Organization not found')
  }

  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { id: true, settings: true },
  })

  if (!org) {
    throw new BadRequestError('Organization not found')
  }

  return org
}

const hasLeavePolicyManagePermission = (req: AuthRequest): boolean => {
  const roleName = req.user?.role
  if (roleName === 'Super Admin') return true

  const perms = Array.isArray(req.user?.permissions) ? req.user?.permissions : []
  return perms.includes('leave_policies.manage')
}

const leavePolicySchema = Joi.object({
  policies: Joi.object()
    .pattern(
      Joi.string().valid('annual', 'sick', 'personal', 'maternity', 'paternity', 'unpaid'),
      Joi.object({
        annualEntitlementDays: Joi.number().min(0).max(365).required(),
        carryForwardMaxDays: Joi.number().min(0).max(365).optional(),
        accrual: Joi.object({
          enabled: Joi.boolean().required(),
          frequency: Joi.string().valid('monthly').required(),
        }).optional(),
      })
    )
    .required(),
  calendar: Joi.object({
    holidays: Joi.array().items(Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/)).max(366).optional(),
  }).optional(),
}).required()

const toSettingsObject = (value: unknown): Record<string, unknown> => {
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return {}
}

// Get leave policy settings (stored under CompanySettings.settings.leave)
export const getLeavePolicy = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!hasLeavePolicyManagePermission(req)) {
    throw new BadRequestError('Missing permission: leave_policies.manage')
  }

  const org = await ensureOrganization(req.user?.organizationId ?? null)
  const root = toSettingsObject(org.settings)
  const leave = toSettingsObject(root.leave)

  res.json({
    success: true,
    data: leave,
  })
})

// Update leave policy settings (stored under CompanySettings.settings.leave)
export const updateLeavePolicy = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!hasLeavePolicyManagePermission(req)) {
    throw new BadRequestError('Missing permission: leave_policies.manage')
  }

  const { error, value } = leavePolicySchema.validate(req.body, { abortEarly: false, stripUnknown: true })
  if (error) {
    throw new BadRequestError(error.message)
  }

  const org = await ensureOrganization(req.user?.organizationId ?? null)
  const root = toSettingsObject(org.settings)
  const previousLeave = toSettingsObject(root.leave)

  const nextSettings: Record<string, unknown> = {
    ...root,
    leave: value,
  }

  const updated = await prisma.organization.update({
    where: { id: org.id },
    data: {
      settings: nextSettings as unknown as Prisma.InputJsonValue,
    },
    select: { settings: true },
  })

  const updatedRoot = toSettingsObject(updated.settings)

  const actorUserId = req.user?.id
  if (actorUserId) {
    await createAuditLog({
      userId: actorUserId,
      action: 'leave_policies.update',
      resourceId: org.id,
      oldValues: ({ leave: previousLeave } as unknown) as Prisma.InputJsonValue,
      newValues: ({ leave: toSettingsObject(updatedRoot.leave) } as unknown) as Prisma.InputJsonValue,
      req,
    })
  }

  res.json({
    success: true,
    data: toSettingsObject(updatedRoot.leave),
  })
})

// Upload organization logo
export const uploadBrandLogo = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.file) {
    throw new BadRequestError('No file uploaded')
  }

  const logoUrl = getFileUrl(req, req.file)
  const settings = await ensureSettings(req.user?.organizationId ?? null)

  // delete previous logo from Cloudinary if applicable
  if (settings.logoUrl && settings.logoUrl !== logoUrl) {
    await deleteFromCloudinaryIfPossible(settings.logoUrl)
  }

  await prisma.companySettings.update({
    where: { id: settings.id },
    data: { logoUrl }
  })

  res.json({
    success: true,
    data: { logoUrl },
  })
})

// Upload organization favicon
export const uploadBrandFavicon = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.file) {
    throw new BadRequestError('No file uploaded')
  }

  const faviconUrl = getFileUrl(req, req.file)
  const settings = await ensureSettings(req.user?.organizationId ?? null)

  if (settings.faviconUrl && settings.faviconUrl !== faviconUrl) {
    await deleteFromCloudinaryIfPossible(settings.faviconUrl)
  }

  await prisma.companySettings.update({
    where: { id: settings.id },
    data: { faviconUrl }
  })

  res.json({
    success: true,
    data: { faviconUrl },
  })
})

// Delete organization logo
export const deleteBrandLogo = asyncHandler(async (req: AuthRequest, res: Response) => {
  const settings = await ensureSettings(req.user?.organizationId ?? null)
  if (settings.logoUrl) {
    await deleteFromCloudinaryIfPossible(settings.logoUrl)
  }

  await prisma.companySettings.update({
    where: { id: settings.id },
    data: { logoUrl: null }
  })

  res.json({ success: true, data: { logoUrl: null } })
})

// Delete organization favicon
export const deleteBrandFavicon = asyncHandler(async (req: AuthRequest, res: Response) => {
  const settings = await ensureSettings(req.user?.organizationId ?? null)
  if (settings.faviconUrl) {
    await deleteFromCloudinaryIfPossible(settings.faviconUrl)
  }

  await prisma.companySettings.update({
    where: { id: settings.id },
    data: { faviconUrl: null }
  })

  res.json({ success: true, data: { faviconUrl: null } })
})

// Get organization settings
export const getSettings = asyncHandler(async (req: AuthRequest, res: Response) => {
  let settings = await prisma.companySettings.findFirst({
    where: { organizationId: req.user?.organizationId ?? null },
  })

  if (!settings) {
    settings = await prisma.companySettings.create({
      data: { organizationId: req.user?.organizationId ?? null } // Use defaults
    })
  }

  res.json({
    success: true,
    data: settings
  })
})

export const getPublicBranding = asyncHandler(async (req: Request, res: Response) => {
  const tenantReq = req as TenantRequest
  const organizationId = tenantReq.tenant?.id ?? null

  let settings = null as Awaited<ReturnType<typeof prisma.companySettings.findFirst>>

  if (organizationId) {
    // Multi-tenant path: honor the resolved tenant organization only.
    settings = await prisma.companySettings.findFirst({
      where: { organizationId },
    })
  } else {
    // Single-tenant / localhost (no tenant slug):
    // use the most recently updated CompanySettings row so that
    // public branding (logo, favicon, etc.) matches what admins
    // configure via /org/settings.
    settings = await prisma.companySettings.findFirst({
      orderBy: { updatedAt: 'desc' },
    })
  }

  if (!settings) {
    settings = await prisma.companySettings.create({
      data: {
        organizationId,
        siteName: 'NovaHR',
        tagline: 'Workforce Management',
      }
    })
  }

  res.json({
    success: true,
    data: {
      siteName: settings.siteName || 'NovaHR',
      tagline: settings.tagline || 'Workforce Management',
      shortName: 'HR', // Schema doesn't have shortName yet
      companyName: settings.companyName,
      companyAddress: settings.companyAddress,
      logoUrl: settings.logoUrl,
      faviconUrl: settings.faviconUrl,
      footerYear: settings.footerYear,
      loginHeroTitle: settings.loginHeroTitle,
      loginHeroSubtitle: settings.loginHeroSubtitle,
      loginAccentColor: settings.loginAccentColor,
      loginBackgroundImage: settings.loginBackgroundImage,
      loginHighlights: normalizeHighlights(settings.loginHighlights)
    }
  })
})

export const getPublicPolicies = asyncHandler(async (req: Request, res: Response) => {
  const tenantReq = req as TenantRequest
  const organizationId = tenantReq.tenant?.id ?? null

  let settings = null as Awaited<ReturnType<typeof prisma.companySettings.findFirst>>

  if (organizationId) {
    settings = await prisma.companySettings.findFirst({
      where: { organizationId },
    })
  } else {
    settings = await prisma.companySettings.findFirst({
      orderBy: { updatedAt: 'desc' },
    })
  }

  res.json({
    success: true,
    data: {
      privacyPolicyText: settings?.privacyPolicyText ?? null,
      termsOfServiceText: settings?.termsOfServiceText ?? null,
    }
  })
})

// Update organization settings
export const updateSettings = asyncHandler(async (req: AuthRequest, res: Response) => {
  const normalizedHighlights = normalizeHighlights(req.body.loginHighlights)
  const actorUserId = req.user?.id

  let settings = await prisma.companySettings.findFirst({
    where: { organizationId: req.user?.organizationId ?? null },
  })

  const previousPolicies = settings
    ? {
        privacyPolicyText: settings.privacyPolicyText ?? null,
        termsOfServiceText: settings.termsOfServiceText ?? null,
      }
    : null

  if (settings) {
    settings = await prisma.companySettings.update({
      where: { id: settings.id },
      data: {
        siteName: req.body.siteName,
        tagline: req.body.tagline,
        companyName: req.body.companyName,
        companyAddress: req.body.companyAddress,
        footerYear: req.body.footerYear,
        privacyPolicyText: req.body.privacyPolicyText ?? null,
        termsOfServiceText: req.body.termsOfServiceText ?? null,
        loginHeroTitle: req.body.loginHeroTitle,
        loginHeroSubtitle: req.body.loginHeroSubtitle,
        loginAccentColor: req.body.loginAccentColor || null,
        loginBackgroundImage: req.body.loginBackgroundImage || null,
        loginHighlights: normalizedHighlights
      }
    })
  } else {
    settings = await prisma.companySettings.create({
      data: {
        organizationId: req.user?.organizationId ?? null,
        siteName: req.body.siteName,
        tagline: req.body.tagline,
        companyName: req.body.companyName,
        companyAddress: req.body.companyAddress,
        footerYear: req.body.footerYear,
        privacyPolicyText: req.body.privacyPolicyText ?? null,
        termsOfServiceText: req.body.termsOfServiceText ?? null,
        loginHeroTitle: req.body.loginHeroTitle,
        loginHeroSubtitle: req.body.loginHeroSubtitle,
        loginAccentColor: req.body.loginAccentColor || null,
        loginBackgroundImage: req.body.loginBackgroundImage || null,
        loginHighlights: normalizedHighlights
      }
    })
  }

  res.json({
    success: true,
    data: settings
  })
})
