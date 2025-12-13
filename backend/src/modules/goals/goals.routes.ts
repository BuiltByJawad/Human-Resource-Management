
import { Router } from 'express';
import { authenticate, authorize } from '../../shared/middleware/auth';
import * as goalsController from './goals.controller';

const router = Router();

router.post(
    '/',
    authenticate,
    goalsController.createGoal
);

router.get(
    '/my-goals',
    authenticate,
    goalsController.getMyGoals
);

router.post(
    '/key-results',
    authenticate,
    goalsController.addKeyResult
);

router.patch(
    '/key-results/:id',
    authenticate,
    goalsController.updateKeyResultProgress
);

export default router;
