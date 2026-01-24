import { Router } from 'express'
import { uploadBranding } from '@/shared/middleware/uploadMiddleware'
import { authenticate, checkPermission } from '@/shared/middleware/auth'
import { uploadBrandLogo, uploadBrandFavicon, getSettings, updateSettings, getPublicBranding, getPublicPolicies } from '@/controllers/orgController'
import { validateRequest } from '@/shared/middleware/validation'
import { orgSettingsSchema } from '@/validators'

const router = Router()

router.get('/settings', authenticate, checkPermission('settings', 'manage_system_settings'), getSettings)
router.put('/settings', authenticate, checkPermission('settings', 'manage_system_settings'), validateRequest(orgSettingsSchema), updateSettings)
router.post('/branding/logo', authenticate, checkPermission('settings', 'manage_system_settings'), uploadBranding.single('logo'), uploadBrandLogo)
router.post('/branding/favicon', authenticate, checkPermission('settings', 'manage_system_settings'), uploadBranding.single('favicon'), uploadBrandFavicon)
router.get('/branding/public', getPublicBranding)
router.get('/policies/public', getPublicPolicies)

export default router
