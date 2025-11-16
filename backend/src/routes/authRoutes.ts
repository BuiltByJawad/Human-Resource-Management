import { Router } from 'express'
import { login, refreshToken, getProfile } from '../controllers/authController'
import { authenticate } from '../middleware/auth'
import { validateRequest } from '../middleware/validation'
import { loginSchema } from '../validators'
import { authRateLimiter } from '../middleware/security'

const router = Router()

router.post('/login', authRateLimiter, validateRequest(loginSchema), login)
router.post('/refresh', refreshToken)
router.get('/me', authenticate, getProfile)

export default router