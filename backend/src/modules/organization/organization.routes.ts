import { Router } from 'express';
// Use legacy orgController for branding/settings to align with companySettings schema
import {
  deleteBrandFavicon,
  deleteBrandLogo,
  getLeavePolicy,
  getPublicBranding,
  getSettings,
  updateLeavePolicy,
  updateSettings,
  uploadBrandFavicon,
  uploadBrandLogo,
} from '../../controllers/orgController';
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
router.get('/branding/public', resolveTenant, getPublicBranding);

// Protected routes
router.use(authenticate);

router.get('/settings', getSettings);
router.put('/settings', updateSettings);
router.get('/leave-policy', getLeavePolicy);
router.put('/leave-policy', updateLeavePolicy);
router.post('/branding/logo', uploadBranding.single('logo'), uploadBrandLogo);
router.post('/branding/favicon', uploadBranding.single('favicon'), uploadBrandFavicon);
router.delete('/branding/logo', deleteBrandLogo);
router.delete('/branding/favicon', deleteBrandFavicon);

export default router;
