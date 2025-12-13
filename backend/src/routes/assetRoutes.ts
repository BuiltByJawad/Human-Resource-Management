import { Router } from 'express'
import { authenticate, authorize } from '@/shared/middleware/auth';
import {
    getAssets,
    createAsset,
    updateAsset,
    assignAsset,
    returnAsset,
    addMaintenanceLog,
    getAssetDetails
} from '../controllers/assetController'

const router = Router()

// All routes require authentication
router.use(authenticate)

// Read-only access for most roles? Or maybe just HR/Admin for now.
// Let's restrict management to HR Admin and Super Admin.
// Employees might need to see their own assets (future feature).

router.get('/', authorize(['Super Admin', 'HR Admin']), getAssets)
router.post('/', authorize(['Super Admin', 'HR Admin']), createAsset)
router.get('/:id', authorize(['Super Admin', 'HR Admin']), getAssetDetails)
router.patch('/:id', authorize(['Super Admin', 'HR Admin']), updateAsset)

router.post('/:id/assign', authorize(['Super Admin', 'HR Admin']), assignAsset)
router.post('/:id/return', authorize(['Super Admin', 'HR Admin']), returnAsset)
router.post('/:id/maintenance', authorize(['Super Admin', 'HR Admin']), addMaintenanceLog)

export default router
