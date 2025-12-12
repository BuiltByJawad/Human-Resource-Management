
import { Request, Response } from 'express';
import { asyncHandler } from '../../shared/middleware/errorHandler';
import { documentsService } from './documents.service';
import { createDocumentSchema, updateDocumentSchema } from './dto';

export const uploadDocument = asyncHandler(async (req: Request, res: Response) => {
    const { error, value } = createDocumentSchema.validate(req.body);
    if (error) throw new Error(error.details[0].message);

    const uploadedBy = (req as any).user?.id;
    if (!uploadedBy) throw new Error("User not authenticated");

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
