import { Router } from 'express';
import * as performanceController from './performance.controller';
import { authenticate, checkPermission } from '../../shared/middleware/auth';

/**
 * @swagger
 * tags:
 *   name: Performance
 *   description: Performance reviews and cycles
 */

const router = Router();
router.use(authenticate);

router.get('/reviews', checkPermission('performance', 'view'), performanceController.getAllReviews);
router.get('/reviews/:id', checkPermission('performance', 'view'), performanceController.getReviewById);
router.post('/reviews', checkPermission('performance', 'review'), performanceController.createReview);
router.get('/cycles', checkPermission('performance', 'view'), performanceController.getCycles);
router.post('/cycles', checkPermission('performance', 'manage_cycles'), performanceController.createCycle);

export default router;
