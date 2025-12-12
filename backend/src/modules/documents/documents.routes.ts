
import { Router } from 'express';
import { authenticate, authorize } from '../../shared/middleware/auth';
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
    authorize(['Super Admin', 'HR Admin']),
    documentsController.uploadDocument
);

router.patch(
    '/:id',
    authenticate,
    authorize(['Super Admin', 'HR Admin']),
    documentsController.updateDocument
);

router.delete(
    '/:id',
    authenticate,
    authorize(['Super Admin', 'HR Admin']),
    documentsController.deleteDocument
);

export default router;
