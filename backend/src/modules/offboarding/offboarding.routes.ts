
import { Router } from 'express';
import { authenticate, authorize } from '../../shared/middleware/auth';
import * as offboardingController from './offboarding.controller';

const router = Router();

// Initiate offboarding (Admin/HR only)
router.post(
    '/initiate',
    authenticate,
    authorize(['Super Admin', 'HR Admin']),
    offboardingController.initiateOffboarding
);

// Get list of all offboarding processes (Admin/HR)
router.get(
    '/',
    authenticate,
    authorize(['Super Admin', 'HR Admin']),
    offboardingController.getAllOffboarding
);

// Get specific offboarding status (Admin/HR/Manager or Employee themselves - add self check logic later if needed)
router.get(
    '/:employeeId',
    authenticate,
    authorize(['Super Admin', 'HR Admin', 'Manager']),
    offboardingController.getOffboarding
);

// Update task status (Admin/HR/IT)
router.patch(
    '/tasks/:taskId',
    authenticate,
    authorize(['Super Admin', 'HR Admin', 'IT Admin']),
    offboardingController.updateTask
);

export default router;
