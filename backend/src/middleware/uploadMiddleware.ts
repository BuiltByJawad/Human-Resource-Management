import multer from 'multer'
import { storage } from '../config/cloudinary'

const fileFilter = (req: any, file: any, cb: any) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true)
    } else {
        cb(new Error('Not an image! Please upload an image.'), false)
    }
}

const isCloudinaryConfigured = process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET

const storageConfig = isCloudinaryConfigured
    ? storage
    : multer.diskStorage({
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

export const upload = multer({
    storage: storageConfig,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
})
