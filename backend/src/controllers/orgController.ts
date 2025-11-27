import { Request, Response } from 'express'
import { asyncHandler } from '../middleware/errorHandler'
import { BadRequestError } from '../utils/errors'
import { AuthRequest } from '../middleware/auth'
import { prisma } from '../config/database'

// Helper to get full URL for local uploads
const getFileUrl = (req: Request, file: any) => {
  if (file.path && (file.path.startsWith('http') || file.path.startsWith('https'))) {
    return file.path
  }
  // Local upload
  const protocol = req.protocol
  const host = req.get('host')
  return `${protocol}://${host}/uploads/${file.filename}`
}

// Upload organization logo
export const uploadBrandLogo = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.file) {
    throw new BadRequestError('No file uploaded')
  }

  const logoUrl = getFileUrl(req, req.file)

  // Update or create settings
  // We assume there's only one settings record for the company for now
  const settings = await prisma.companySettings.findFirst()

  if (settings) {
    await prisma.companySettings.update({
      where: { id: settings.id },
      data: { logoUrl }
    })
  } else {
    await prisma.companySettings.create({
      data: { logoUrl }
    })
  }

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

  const settings = await prisma.companySettings.findFirst()

  if (settings) {
    await prisma.companySettings.update({
      where: { id: settings.id },
      data: { faviconUrl }
    })
  } else {
    await prisma.companySettings.create({
      data: { faviconUrl }
    })
  }

  res.json({
    success: true,
    data: { faviconUrl },
  })
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
