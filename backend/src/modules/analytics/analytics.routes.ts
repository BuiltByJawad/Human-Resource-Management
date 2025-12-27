import { Router } from 'express';
import * as analyticsController from './analytics.controller';
import { authenticate, authorize } from '../../shared/middleware/auth';
import { getBurnoutAnalytics } from '../../controllers/burnout.controller';

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
router.get('/burnout', authorize(['Super Admin', 'HR Admin']), getBurnoutAnalytics);

export default router;
