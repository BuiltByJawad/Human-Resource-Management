import { Router } from 'express'
import { login, register, refreshToken, getProfile, uploadAvatar, changePassword, updateProfile, inviteUser, completeInvite, requestPasswordReset, resetPassword } from '@/controllers/authController'
import { protect, checkPermission } from '@/shared/middleware/auth'
import { validateRequest } from '@/shared/middleware/validation'
import { loginSchema, registerSchema, changePasswordSchema, updateProfileSchema, inviteUserSchema, completeInviteSchema, passwordResetRequestSchema, resetPasswordSchema, refreshTokenSchema } from '@/validators'
import { adminRateLimiter, authRateLimiter } from '@/shared/middleware/security'

import { upload } from '@/shared/middleware/uploadMiddleware'
import { logout } from '@/modules/auth/auth.controller'

const router = Router()

router.post('/register', authRateLimiter, validateRequest(registerSchema), register)
router.post('/login', authRateLimiter, validateRequest(loginSchema), login)
router.post('/refresh-token', authRateLimiter, validateRequest(refreshTokenSchema), refreshToken)
router.get('/profile', protect, adminRateLimiter, getProfile)

router.post('/logout', protect, logout)
router.put('/avatar', protect, upload.single('avatar'), uploadAvatar)
router.put('/change-password', protect, adminRateLimiter, validateRequest(changePasswordSchema), changePassword)

router.put('/profile', protect, adminRateLimiter, validateRequest(updateProfileSchema), updateProfile)

router.post('/invite', protect, checkPermission('roles', 'assign'), validateRequest(inviteUserSchema), inviteUser)
router.post('/complete-invite', authRateLimiter, validateRequest(completeInviteSchema), completeInvite)
router.post('/password-reset/request', authRateLimiter, validateRequest(passwordResetRequestSchema), requestPasswordReset)
router.post('/password-reset/complete', authRateLimiter, validateRequest(resetPasswordSchema), resetPassword)

export default router