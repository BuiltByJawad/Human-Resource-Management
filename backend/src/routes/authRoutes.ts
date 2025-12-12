import { Router } from 'express'
import { login, register, refreshToken, getProfile, uploadAvatar, changePassword, updateProfile, inviteUser, completeInvite, requestPasswordReset, resetPassword } from '../controllers/authController'
import { protect, checkPermission } from '../middleware/auth'
import { validateRequest } from '../middleware/validation'
import { loginSchema, registerSchema, changePasswordSchema, updateProfileSchema, inviteUserSchema, completeInviteSchema, passwordResetRequestSchema, resetPasswordSchema, refreshTokenSchema } from '../validators'
import { authRateLimiter } from '../middleware/security'
import { upload } from '../middleware/uploadMiddleware'

const router = Router()

router.post('/register', authRateLimiter, validateRequest(registerSchema), register)
router.post('/login', authRateLimiter, validateRequest(loginSchema), login)
router.post('/refresh-token', validateRequest(refreshTokenSchema), refreshToken)
router.get('/profile', protect, getProfile)
router.put('/avatar', protect, upload.single('avatar'), uploadAvatar)
router.put('/change-password', protect, validateRequest(changePasswordSchema), changePassword)
router.put('/profile', protect, validateRequest(updateProfileSchema), updateProfile)
router.post('/invite', protect, checkPermission('roles', 'assign'), validateRequest(inviteUserSchema), inviteUser)
router.post('/complete-invite', validateRequest(completeInviteSchema), completeInvite)
router.post('/password-reset/request', validateRequest(passwordResetRequestSchema), requestPasswordReset)
router.post('/password-reset/complete', validateRequest(resetPasswordSchema), resetPassword)

export default router