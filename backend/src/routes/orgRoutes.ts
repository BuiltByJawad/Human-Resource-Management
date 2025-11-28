import { Router } from 'express'
import { uploadBranding } from '../middleware/uploadMiddleware'
import { authenticate, checkPermission } from '../middleware/auth'
import { uploadBrandLogo, uploadBrandFavicon, getSettings, updateSettings, getPublicBranding } from '../controllers/orgController'

const router = Router()

router.get('/settings', authenticate, checkPermission('settings', 'manage_system_settings'), getSettings)
router.put('/settings', authenticate, checkPermission('settings', 'manage_system_settings'), updateSettings)
router.post('/branding/logo', authenticate, checkPermission('settings', 'manage_system_settings'), uploadBranding.single('logo'), uploadBrandLogo)
router.post('/branding/favicon', authenticate, checkPermission('settings', 'manage_system_settings'), uploadBranding.single('favicon'), uploadBrandFavicon)
router.get('/branding/public', getPublicBranding)

export default router
