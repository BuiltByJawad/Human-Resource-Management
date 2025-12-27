import { Router } from 'express';
// Use legacy orgController for branding/settings to align with companySettings schema
import * as organizationController from '../../controllers/orgController';
import { authenticate } from '../../shared/middleware/auth';
import { resolveTenant } from '../../shared/middleware/tenant';
import { uploadBranding } from '../../shared/middleware/uploadMiddleware';

/**
 * @swagger
 * tags:
 *   name: Organization
 *   description: Organization settings management
 */

const router = Router();

// Public branding endpoint (no auth needed)
router.get('/branding/public', resolveTenant, organizationController.getPublicBranding);

// Protected routes
router.use(authenticate);

router.get('/settings', organizationController.getSettings);
router.put('/settings', organizationController.updateSettings);
router.post('/branding/logo', uploadBranding.single('logo'), organizationController.uploadBrandLogo);
router.post('/branding/favicon', uploadBranding.single('favicon'), organizationController.uploadBrandFavicon);
router.delete('/branding/logo', organizationController.deleteBrandLogo);
router.delete('/branding/favicon', organizationController.deleteBrandFavicon);

export default router;
