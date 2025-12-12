import { Router } from 'express';
import * as organizationController from './organization.controller';
import { authenticate } from '../../shared/middleware/auth';

/**
 * @swagger
 * tags:
 *   name: Organization
 *   description: Organization settings management
 */

const router = Router();
router.use(authenticate);

router.get('/settings', organizationController.getSettings);
router.put('/settings', organizationController.updateSettings);

export default router;
