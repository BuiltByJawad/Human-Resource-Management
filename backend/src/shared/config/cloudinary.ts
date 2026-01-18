import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import dotenv from 'dotenv';

dotenv.config();

const isCloudinaryConfigured = !!(
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

// Only create CloudinaryStorage when Cloudinary is configured
export const storage = isCloudinaryConfigured
    ? new CloudinaryStorage({
        cloudinary: cloudinary,
        params: {
            folder: 'hrm-avatars',
            allowed_formats: ['jpg', 'png', 'jpeg', 'gif', 'webp', 'svg', 'ico'],
            transformation: [{ width: 500, height: 500, crop: 'limit' }],
        } as any,
    })
    : null;

export const documentStorage = isCloudinaryConfigured
    ? new CloudinaryStorage({
        cloudinary: cloudinary,
        params: {
            folder: 'hrm-documents',
            resource_type: 'raw',
            use_filename: true,
            unique_filename: false,
            allowed_formats: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'],
        } as any,
    })
    : null;

export default cloudinary;