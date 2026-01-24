import { Router } from 'express';
import * as authController from './auth.controller';
import { authenticate } from '../../shared/middleware/auth';
import { resolveTenant } from '../../shared/middleware/tenant';
import { upload } from '../../shared/middleware/uploadMiddleware';
import { adminRateLimiter, authRateLimiter } from '../../shared/middleware/security';

const router = Router();

// Public routes
router.post('/register', authRateLimiter, resolveTenant, authController.register);
router.post('/login', authRateLimiter, resolveTenant, authController.login);
router.post('/refresh', authRateLimiter, authController.refreshToken);
router.post('/password/request-reset', authRateLimiter, authController.requestPasswordReset);
router.post('/password/reset', authRateLimiter, authController.resetPassword);
router.post('/invite/complete', authRateLimiter, authController.completeInvite);

// Protected routes
router.use(authenticate); // All routes below require authentication

router.get('/profile', adminRateLimiter, authController.getProfile);
router.get('/me', adminRateLimiter, authController.getProfile); // Alias for frontend compatibility
router.post('/logout', authController.logout);
router.put('/profile', adminRateLimiter, authController.updateProfile);
router.post('/avatar', upload.single('avatar'), authController.uploadAvatar);
router.post('/password/change', adminRateLimiter, authController.changePassword);
router.post('/invite', authController.inviteUser);

export default router;
