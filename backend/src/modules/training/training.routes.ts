
import { Router } from 'express';
import { authenticate, checkPermission } from '../../shared/middleware/auth';
import * as trainingController from './training.controller';

const router = Router();

// Courses
router.get(
    '/courses',
    authenticate,
    trainingController.getCourses
);

router.post(
    '/courses',
    authenticate,
    checkPermission('training', 'manage'),
    trainingController.createCourse
);

// Assignments
router.post(
    '/assign',
    authenticate,
    checkPermission('training', 'manage'),
    trainingController.assignCourse
);

router.get(
    '/my-training',
    authenticate,
    trainingController.getMyTraining
);

// Progress
router.patch(
    '/:id/progress',
    authenticate,
    trainingController.updateProgress
);

export default router;
