import { Request, Response } from 'express'
import { asyncHandler } from '@/shared/middleware/errorHandler'
import { BadRequestError } from '@/shared/utils/errors'
import { AuthRequest } from '@/shared/middleware/auth'
import { prisma } from '@/shared/config/database'
import cloudinary from '@/shared/config/cloudinary'

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

const ensureSettings = async () => {
  let settings = await prisma.companySettings.findFirst()
  if (!settings) {
    settings = await prisma.companySettings.create({ data: {} })
  }
  return settings
}

// Upload organization logo
export const uploadBrandLogo = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.file) {
    throw new BadRequestError('No file uploaded')
  }

  const logoUrl = getFileUrl(req, req.file)
  const settings = await ensureSettings()

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
  const settings = await ensureSettings()

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
export const deleteBrandLogo = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const settings = await ensureSettings()
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
export const deleteBrandFavicon = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const settings = await ensureSettings()
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
  let settings = await prisma.companySettings.findFirst()

  if (!settings) {
    settings = await prisma.companySettings.create({
      data: {} // Use defaults
    })
  }

  res.json({
    success: true,
    data: settings
  })
})

export const getPublicBranding = asyncHandler(async (_req: Request, res: Response) => {
  let settings = await prisma.companySettings.findFirst()

  if (!settings) {
    settings = await prisma.companySettings.create({ data: {} })
  }

  const { siteName, tagline, companyName, companyAddress, logoUrl, faviconUrl } = settings

  res.json({
    success: true,
    data: {
      siteName,
      tagline,
      companyName,
      companyAddress,
      logoUrl,
      faviconUrl
    }
  })
})

// Update organization settings
export const updateSettings = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { siteName, tagline, companyName, companyAddress } = req.body

  let settings = await prisma.companySettings.findFirst()

  if (settings) {
    settings = await prisma.companySettings.update({
      where: { id: settings.id },
      data: {
        siteName,
        tagline,
        companyName,
        companyAddress
      }
    })
  } else {
    settings = await prisma.companySettings.create({
      data: {
        siteName,
        tagline,
        companyName,
        companyAddress
      }
    })
  }

  res.json({
    success: true,
    data: settings
  })
})
