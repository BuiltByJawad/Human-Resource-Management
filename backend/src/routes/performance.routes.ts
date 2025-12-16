import { Router } from 'express';
import {
    createReviewCycle,
    getReviewCycles,
    createReview,
    getEmployeeReviews,
    summarizeFeedback
} from '@/controllers/performance.controller';
import { authenticate, authorize } from '@/shared/middleware/auth';

const router = Router();
console.log('Loading performance routes file...');

// Cycles
router.post('/cycles', authenticate, authorize(['admin', 'hr_manager']), createReviewCycle);
router.get('/cycles', authenticate, getReviewCycles);

// Reviews
router.post('/reviews', authenticate, createReview);
router.get('/reviews/:employeeId', authenticate, getEmployeeReviews);
router.post('/reviews/summarize', authenticate, authorize(['admin', 'manager']), summarizeFeedback);

export default router;
