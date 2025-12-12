
import { Router } from 'express';
import { authenticate, authorize } from '../../shared/middleware/auth';
import * as onboardingController from './onboarding.controller';

const router = Router();

// Templates (HR/Manager)
router.get(
    '/templates',
    authenticate,
    authorize(['Super Admin', 'HR Admin', 'Manager']),
    onboardingController.getTemplates
);

router.post(
    '/templates',
    authenticate,
    authorize(['Super Admin', 'HR Admin']),
    onboardingController.createTemplate
);

router.post(
    '/templates/tasks',
    authenticate,
    authorize(['Super Admin', 'HR Admin']),
    onboardingController.addTaskToTemplate
);

// Onboarding Process
router.post(
    '/process',
    authenticate,
    authorize(['Super Admin', 'HR Admin', 'Manager']),
    onboardingController.startOnboarding
);

router.get(
    '/process/:employeeId',
    authenticate,
    // Authorize: Admin/Manager or the employee themselves. 
    // For now, allow admins. Employee access might need check against req.user
    authorize(['Super Admin', 'HR Admin', 'Manager', 'Employee']),
    onboardingController.getMyOnboarding
);

router.patch(
    '/tasks/:taskId',
    authenticate,
    authorize(['Super Admin', 'HR Admin', 'Manager', 'Employee']),
    onboardingController.updateTaskStatus
);

router.get(
    '/dashboard',
    authenticate,
    authorize(['Super Admin', 'HR Admin']),
    onboardingController.getDashboard
);

export default router;
