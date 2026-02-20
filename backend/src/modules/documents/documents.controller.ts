
import { Request, Response } from 'express';
import { asyncHandler } from '../../shared/middleware/errorHandler';
import { documentsService } from './documents.service';
import { createDocumentSchema, updateDocumentSchema } from './dto';
import { prisma } from '../../shared/config/database';

export const uploadDocument = asyncHandler(async (req: Request, res: Response) => {
    const file = (req as any).file as any;
    if (!file) {
        throw new Error('No file uploaded');
    }

    const fileUrl =
        file.path && typeof file.path === 'string' && /^https?:\/\//.test(file.path)
            ? file.path
            : (() => {
                const baseUrl = process.env.FILE_BASE_URL || `${req.protocol}://${req.get('host')}`;
                const filename =
                    file.filename ||
                    (typeof file.path === 'string' ? file.path.split(/[\\/]/).pop() : undefined);
                if (!filename) {
                    throw new Error('Unable to determine uploaded file name');
                }
                return `${baseUrl}/uploads/${filename}`;
            })();

    const payload = {
        ...req.body,
        fileUrl,
        type: file.mimetype,
    };

    const { error, value } = createDocumentSchema.validate(payload);
    if (error) throw new Error(error.details[0].message);

    const categoryName = typeof value.category === 'string' ? value.category : '';
    const category = await prisma.documentCategory.findUnique({ where: { name: categoryName } });
    if (!category || !category.isActive) {
        throw new Error('Invalid document category');
    }

    const userPermissions = Array.isArray((req as any).user?.permissions) ? ((req as any).user.permissions as string[]) : [];
    const canManageDocuments = userPermissions.includes('documents.manage') || (req as any).user?.role === 'Super Admin';
    if (!canManageDocuments && !category.allowEmployeeUpload) {
        throw new Error('You are not allowed to upload documents to this category');
    }

    const uploadedBy = (req as any).user?.id;
    if (!uploadedBy) throw new Error('User not authenticated');

    const doc = await documentsService.uploadDocument(value, uploadedBy);
    res.status(201).json({ success: true, data: doc });
});

export const getDocuments = asyncHandler(async (req: Request, res: Response) => {
    const { category } = req.query;
    const docs = await documentsService.getDocuments(category as string);
    res.json({ success: true, data: docs });
});

export const getDocument = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const doc = await documentsService.getDocument(id);
    res.json({ success: true, data: doc });
});

export const updateDocument = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { error, value } = updateDocumentSchema.validate(req.body);
    if (error) throw new Error(error.details[0].message);

    const doc = await documentsService.updateDocument(id, value);
    res.json({ success: true, data: doc });
});

export const deleteDocument = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    await documentsService.deleteDocument(id);
    res.json({ success: true, message: 'Document deleted successfully' });
});
