import { Router } from 'express';
import { getBurnoutAnalytics } from '../controllers/burnout.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Burnout analytics endpoint - restricted to admin and hr_manager
router.get('/burnout', authenticate, authorize(['Super Admin', 'HR Admin']), getBurnoutAnalytics);

export default router;
