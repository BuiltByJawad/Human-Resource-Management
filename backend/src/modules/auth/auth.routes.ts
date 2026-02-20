import { Router } from 'express';
import * as authController from './auth.controller';
import { authenticate } from '../../shared/middleware/auth';
import { upload } from '../../shared/middleware/uploadMiddleware';
import { adminRateLimiter, authRateLimiter } from '../../shared/middleware/security';

const router = Router();

// Public routes
router.post('/register', authRateLimiter, authController.register);
router.post('/login', authRateLimiter, authController.login);
router.post('/refresh', authRateLimiter, authController.refreshToken);
router.post('/mfa/verify', authRateLimiter, authController.verifyMfa);
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
router.post('/mfa/enroll/start', authController.startMfaEnrollment);
router.post('/mfa/enroll/confirm', authController.confirmMfaEnrollment);
router.post('/mfa/disable', authController.disableMfa);

export default router;
