
import { Router } from 'express';
import { authenticate, authorize } from '../../shared/middleware/auth';
import * as expenseController from './expense.controller';

const router = Router();

// Submit Claim (Authenticated Employees)
router.post(
    '/',
    authenticate,
    expenseController.submitClaim
);

// Get My Expenses
router.get(
    '/my/:employeeId',
    authenticate,
    expenseController.getMyExpenses
);

// Get Pending Claims (Manager/Admin)
router.get(
    '/pending',
    authenticate,
    authorize(['Super Admin', 'HR Admin', 'Manager']),
    expenseController.getPendingClaims
);

// Approve/Reject Claim (Manager/Admin)
router.patch(
    '/:id/status',
    authenticate,
    authorize(['Super Admin', 'HR Admin', 'Manager']),
    expenseController.updateStatus
);

export default router;
