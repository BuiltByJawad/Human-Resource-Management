
import { Router } from 'express';
import { authenticate, authorize } from '../../shared/middleware/auth';
import * as benefitsController from './benefits.controller';

const router = Router();

// Create Plan (Admin only)
router.post(
    '/plans',
    authenticate,
    authorize(['Super Admin', 'HR Admin']),
    benefitsController.createPlan
);

// Get All Plans (Authenticated)
router.get(
    '/plans',
    authenticate,
    benefitsController.getPlans
);

// Enroll Employee (Admin/HR)
router.post(
    '/enroll',
    authenticate,
    authorize(['Super Admin', 'HR Admin']),
    benefitsController.enrollEmployee
);

// Get My Benefits (Admin/HR/Self)
router.get(
    '/employee/:employeeId',
    authenticate,
    authorize(['Super Admin', 'HR Admin', 'Employee', 'Manager']),
    benefitsController.getMyBenefits
);

export default router;
