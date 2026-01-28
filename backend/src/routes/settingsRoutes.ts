import { Router } from 'express'
import {
  getBrandingPublic,
  getPolicyHistory,
  getPublicPolicies,
  getSettings,
  getLeavePolicy,
  uploadBrandingFavicon,
  uploadBrandingLogo,
  updateLeavePolicy,
  updateSettings,
} from '@/controllers/settingsController'
import { authenticate, checkPermission } from '@/shared/middleware/auth'
import { uploadBranding } from '@/shared/middleware/uploadMiddleware'

const router = Router()

router.get('/branding/public', getBrandingPublic)
router.get('/policies/public', getPublicPolicies)

router.get('/policies/history', authenticate, checkPermission('settings', 'manage_system_settings'), getPolicyHistory)

router.get('/', authenticate, checkPermission('settings', 'manage_system_settings'), getSettings)
router.put('/', authenticate, checkPermission('settings', 'manage_system_settings'), updateSettings)

router.post(
  '/branding/logo',
  authenticate,
  checkPermission('settings', 'manage_system_settings'),
  uploadBranding.single('logo'),
  uploadBrandingLogo
)
router.post(
  '/branding/favicon',
  authenticate,
  checkPermission('settings', 'manage_system_settings'),
  uploadBranding.single('favicon'),
  uploadBrandingFavicon
)

router.get('/leave-policy', authenticate, checkPermission('leave_policies', 'manage'), getLeavePolicy)
router.put('/leave-policy', authenticate, checkPermission('leave_policies', 'manage'), updateLeavePolicy)

export default router
