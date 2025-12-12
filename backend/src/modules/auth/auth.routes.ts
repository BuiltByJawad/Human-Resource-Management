import { Router } from 'express';
import * as authController from './auth.controller';
import { authenticate } from '../../shared/middleware/auth';
import { upload } from '../../shared/middleware/uploadMiddleware';
import { authRateLimiter } from '../../shared/middleware/security';

const router = Router();

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh', authController.refreshToken);
router.post('/password/request-reset', authController.requestPasswordReset);
router.post('/password/reset', authController.resetPassword);
router.post('/invite/complete', authController.completeInvite);

// Protected routes
router.use(authenticate); // All routes below require authentication

router.get('/profile', authController.getProfile);
router.put('/profile', authController.updateProfile);
router.post('/avatar', upload.single('avatar'), authController.uploadAvatar);
router.post('/password/change', authController.changePassword);
router.post('/invite', authController.inviteUser);

export default router;
