import { Router } from 'express';
import * as analyticsController from './analytics.controller';
import { authenticate } from '../../shared/middleware/auth';

/**
 * @swagger
 * tags:
 *   name: Analytics
 *   description: Dashboards and business analytics
 */

const router = Router();
router.use(authenticate);

router.get('/dashboard', analyticsController.getDashboard);
router.get('/departments', analyticsController.getDepartmentStats);

export default router;
