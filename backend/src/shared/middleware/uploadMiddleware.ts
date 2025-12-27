import multer from 'multer'
import { storage } from '../config/cloudinary'

// Allow image formats including WebP, SVG, ICO
const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'image/x-icon',
    'image/vnd.microsoft.icon',
]

const fileFilter = (req: any, file: any, cb: any) => {
    if (file.mimetype.startsWith('image/') || allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true)
    } else {
        cb(new Error('Not an image! Please upload an image.'), false)
    }
}

// Shared local disk storage (used when Cloudinary is not configured)
const diskStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Ensure uploads directory exists
        const fs = require('fs')
        const path = require('path')
        const uploadDir = path.join(process.cwd(), 'uploads')
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, 'uploads/')
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        const ext = file.originalname.split('.').pop()
        cb(null, file.fieldname + '-' + uniqueSuffix + '.' + ext)
    }
})

// Use Cloudinary storage if available, otherwise fall back to disk
const storageConfig = storage || diskStorage

export const upload = multer({
    storage: storageConfig,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
})

// Branding uploads (logo, favicon) honor Cloudinary when configured; otherwise fallback to disk
export const uploadBranding = multer({
    storage: storageConfig,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
})

