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
router.use(authorize(['Super Admin', 'HR Admin']));

router.get('/dashboard', analyticsController.getDashboard);
router.get('/departments', analyticsController.getDepartmentStats);
router.get('/burnout', getBurnoutAnalytics);
router.get('/events', analyticsController.getUpcomingEvents);

export default router;
