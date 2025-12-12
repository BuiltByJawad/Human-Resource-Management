
import { Router } from 'express';
import { authenticate, authorize } from '../../shared/middleware/auth';
import * as timeController from './time-tracking.controller';

const router = Router();

// Projects (Admin Only)
router.post(
    '/projects',
    authenticate,
    authorize(['Super Admin', 'HR Admin', 'Manager']),
    timeController.createProject
);

router.get(
    '/projects',
    authenticate,
    timeController.getProjects
);

// Time Entries
router.post(
    '/clock-in',
    authenticate,
    timeController.clockIn
);

router.post(
    '/clock-out',
    authenticate,
    timeController.clockOut
);

router.get(
    '/timesheet/:employeeId',
    authenticate,
    timeController.getTimesheet
);

export default router;
