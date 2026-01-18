
import { Router } from 'express';
import { authenticate, checkPermission } from '../../shared/middleware/auth';
import { uploadDocument } from '../../shared/middleware/uploadMiddleware';
import * as documentsController from './documents.controller';

const router = Router();

// Public/Employee View
router.get(
    '/',
    authenticate,
    documentsController.getDocuments
);

router.get(
    '/:id',
    authenticate,
    documentsController.getDocument
);

// Admin Management
router.post(
    '/',
    authenticate,
    checkPermission('documents', 'manage'),
    uploadDocument.single('file'),
    documentsController.uploadDocument
);

router.patch(
    '/:id',
    authenticate,
    checkPermission('documents', 'manage'),
    documentsController.updateDocument
);

router.delete(
    '/:id',
    authenticate,
    checkPermission('documents', 'manage'),
    documentsController.deleteDocument
);

export default router;
