import { Request, Response } from 'express'
import { prisma } from '@/shared/config/database'
import type { Prisma } from '@prisma/client'
import { asyncHandler } from '@/shared/utils/async-handler'
import { BadRequestError } from '@/shared/utils/errors'
import { createAuditLog } from '@/shared/utils/audit'
import { settingsSchema } from '@/validators'
import { AuthRequest } from '@/shared/middleware/auth'

const SETTINGS_SELECT = {
  siteName: true,
  tagline: true,
  companyName: true,
  companyAddress: true,
  logoUrl: true,
  faviconUrl: true,
  footerYear: true,
  privacyPolicyText: true,
  termsOfServiceText: true,
  loginHeroTitle: true,
  loginHeroSubtitle: true,
  loginAccentColor: true,
  loginBackgroundImage: true,
  loginHighlights: true,
  leavePolicy: true,
  payrollConfig: true,
}

const normalizeSettings = (settings: Record<string, unknown> | null) => {
  if (!settings) return {}
  const { leavePolicy, payrollConfig, ...rest } = settings
  return rest
}

const resolveUploadUrl = (file?: Express.Multer.File): string => {
  if (!file) {
    throw new BadRequestError('Upload file is required')
  }

  const filePath = (file as { path?: string }).path
  if (typeof filePath === 'string' && filePath.startsWith('http')) {
    return filePath
  }

  if (typeof file.filename === 'string') {
    return `/uploads/${file.filename}`
  }

  if (typeof filePath === 'string') {
    return filePath.startsWith('/') ? filePath : `/${filePath}`
  }

  throw new BadRequestError('Upload failed')
}

const ensureSettingsRecord = async () => {
  const existing = await prisma.companySettings.findFirst({ orderBy: { createdAt: 'desc' } })
  if (existing) return existing
  return prisma.companySettings.create({ data: {} })
}

export const getBrandingPublic = asyncHandler(async (_req: Request, res: Response) => {
  const settings = await prisma.companySettings.findFirst({
    orderBy: { createdAt: 'desc' },
    select: SETTINGS_SELECT,
  })

  res.json({ success: true, data: normalizeSettings(settings as Record<string, unknown> | null) })
})

export const getSettings = asyncHandler(async (_req: Request, res: Response) => {
  const settings = await prisma.companySettings.findFirst({
    orderBy: { createdAt: 'desc' },
    select: SETTINGS_SELECT,
  })

  res.json({ success: true, data: normalizeSettings(settings as Record<string, unknown> | null) })
})

export const updateSettings = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { error, value } = settingsSchema.validate(req.body, { abortEarly: false, stripUnknown: true })
  if (error) {
    throw new BadRequestError(error.message)
  }

  const record = await ensureSettingsRecord()
  const updated = await prisma.companySettings.update({
    where: { id: record.id },
    data: value,
    select: SETTINGS_SELECT,
  })

  const actorUserId = req.user?.id
  if (actorUserId) {
    await createAuditLog({
      userId: actorUserId,
      action: 'settings.update',
      resourceId: record.id,
      newValues: value,
      req,
    })
  }

  res.json({ success: true, data: normalizeSettings(updated as Record<string, unknown>) })
})

export const uploadBrandingLogo = asyncHandler(async (req: AuthRequest, res: Response) => {
  const logoUrl = resolveUploadUrl(req.file)
  const record = await ensureSettingsRecord()

  const updated = await prisma.companySettings.update({
    where: { id: record.id },
    data: { logoUrl },
    select: { logoUrl: true },
  })

  const actorUserId = req.user?.id
  if (actorUserId) {
    await createAuditLog({
      userId: actorUserId,
      action: 'settings.update_branding',
      resourceId: record.id,
      newValues: { logoUrl },
      req,
    })
  }

  res.json({ success: true, data: { logoUrl: updated.logoUrl } })
})

export const uploadBrandingFavicon = asyncHandler(async (req: AuthRequest, res: Response) => {
  const faviconUrl = resolveUploadUrl(req.file)
  const record = await ensureSettingsRecord()

  const updated = await prisma.companySettings.update({
    where: { id: record.id },
    data: { faviconUrl },
    select: { faviconUrl: true },
  })

  const actorUserId = req.user?.id
  if (actorUserId) {
    await createAuditLog({
      userId: actorUserId,
      action: 'settings.update_branding',
      resourceId: record.id,
      newValues: { faviconUrl },
      req,
    })
  }

  res.json({ success: true, data: { faviconUrl: updated.faviconUrl } })
})

export const getPublicPolicies = asyncHandler(async (_req: Request, res: Response) => {
  const settings = await prisma.companySettings.findFirst({
    orderBy: { createdAt: 'desc' },
    select: { privacyPolicyText: true, termsOfServiceText: true },
  })

  res.json({
    success: true,
    data: {
      privacyPolicyText: settings?.privacyPolicyText ?? null,
      termsOfServiceText: settings?.termsOfServiceText ?? null,
    },
  })
})

export const getPolicyHistory = asyncHandler(async (_req: Request, res: Response) => {
  const entries = await prisma.auditLog.findMany({
    where: {
      action: { in: ['settings.update', 'settings.update_policy', 'settings.update_branding'] },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: {
      user: { select: { id: true, email: true, firstName: true, lastName: true, role: { select: { name: true } } } },
    },
  })

  res.json({ success: true, data: entries })
})

export const updateLeavePolicy = asyncHandler(async (req: AuthRequest, res: Response) => {
  const payload = typeof req.body === 'object' && req.body ? (req.body as Record<string, unknown>) : {}

  const record = await ensureSettingsRecord()
  const updated = await prisma.companySettings.update({
    where: { id: record.id },
    data: { leavePolicy: payload as Prisma.InputJsonValue },
    select: { leavePolicy: true },
  })

  const actorUserId = req.user?.id
  if (actorUserId) {
    await createAuditLog({
      userId: actorUserId,
      action: 'leave_policy.update',
      resourceId: record.id,
      newValues: payload as Prisma.InputJsonValue,
      req,
    })
  }

  res.json({ success: true, data: updated.leavePolicy ?? {} })
})

export const getLeavePolicy = asyncHandler(async (_req: Request, res: Response) => {
  const settings = await prisma.companySettings.findFirst({
    orderBy: { createdAt: 'desc' },
    select: { leavePolicy: true },
  })

  res.json({ success: true, data: settings?.leavePolicy ?? {} })
})
