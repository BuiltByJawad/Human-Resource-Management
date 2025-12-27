
import { Router } from 'express';
import { authenticate } from '../../shared/middleware/auth';
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
    expenseController.getPendingClaims
);

// Approve/Reject Claim (Manager/Admin)
router.patch(
    '/:id/status',
    authenticate,
    expenseController.updateStatus
);

export default router;
