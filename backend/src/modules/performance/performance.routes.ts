import { Router } from 'express';
import * as performanceController from './performance.controller';
import { authenticate } from '../../shared/middleware/auth';

/**
 * @swagger
 * tags:
 *   name: Performance
 *   description: Performance reviews and cycles
 */

const router = Router();
router.use(authenticate);

router.get('/reviews', performanceController.getAllReviews);
router.get('/reviews/:id', performanceController.getReviewById);
router.post('/reviews', performanceController.createReview);
router.get('/cycles', performanceController.getCycles);
router.post('/cycles', performanceController.createCycle);

export default router;
