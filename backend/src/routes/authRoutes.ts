import { Router } from 'express'
import { login, register, refreshToken, getProfile, uploadAvatar, changePassword, updateProfile } from '../controllers/authController'
import { protect } from '../middleware/auth'
import { validateRequest } from '../middleware/validation'
import { loginSchema } from '../validators'
import { authRateLimiter } from '../middleware/security'
import { upload } from '../middleware/uploadMiddleware'

const router = Router()

router.post('/register', authRateLimiter, register)
router.post('/login', authRateLimiter, validateRequest(loginSchema), login)
router.post('/refresh-token', refreshToken)
router.get('/profile', protect, getProfile)
router.put('/avatar', protect, upload.single('avatar'), uploadAvatar)
router.put('/change-password', protect, changePassword)
router.put('/profile', protect, updateProfile)

export default router