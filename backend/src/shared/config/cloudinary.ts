import { v2 as cloudinary } from 'cloudinary';
import type { StorageEngine } from 'multer';
import dotenv from 'dotenv';

dotenv.config();

export const isCloudinaryConfigured = !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
);

if (isCloudinaryConfigured) {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    });
}

type CloudinaryResourceType = 'image' | 'video' | 'raw' | 'auto'

interface CloudinaryV2StorageOptions {
    folder: string
    resourceType: CloudinaryResourceType
    allowedFormats?: string[]
    transformation?: Array<Record<string, unknown>>
}

class CloudinaryV2Storage implements StorageEngine {
    private readonly folder: string
    private readonly resourceType: CloudinaryResourceType
    private readonly allowedFormats?: string[]
    private readonly transformation?: Array<Record<string, unknown>>

    constructor(options: CloudinaryV2StorageOptions) {
        this.folder = options.folder
        this.resourceType = options.resourceType
        this.allowedFormats = options.allowedFormats
        this.transformation = options.transformation
    }

    _handleFile(req: unknown, file: Express.Multer.File, cb: (error?: any, info?: Partial<Express.Multer.File>) => void) {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder: this.folder,
                resource_type: this.resourceType,
                allowed_formats: this.allowedFormats,
                transformation: this.transformation,
            },
            (error, result) => {
                if (error) return cb(error)
                if (!result) return cb(new Error('Cloudinary upload failed'))

                cb(null, {
                    path: result.secure_url,
                    filename: result.public_id,
                    size: result.bytes,
                })
            }
        )

        file.stream.pipe(stream)
    }

    _removeFile(
        req: unknown,
        file: Express.Multer.File & { filename?: string },
        cb: (error: Error | null) => void
    ) {
        const publicId = typeof file.filename === 'string' ? file.filename : null
        if (!publicId) return cb(null)

        cloudinary.uploader.destroy(publicId, { resource_type: this.resourceType }, (error) => {
            cb(error ?? null)
        })
    }
}

// Only create Cloudinary storage engines when Cloudinary is configured.
export const storage: StorageEngine | null = isCloudinaryConfigured
    ? new CloudinaryV2Storage({
        folder: 'hrm-avatars',
        resourceType: 'image',
        allowedFormats: ['jpg', 'png', 'jpeg', 'gif', 'webp', 'svg', 'ico'],
        transformation: [{ width: 500, height: 500, crop: 'limit' }],
    })
    : null;

export const documentStorage: StorageEngine | null = isCloudinaryConfigured
    ? new CloudinaryV2Storage({
        folder: 'hrm-documents',
        resourceType: 'raw',
        allowedFormats: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'],
    })
    : null;

export default cloudinary;