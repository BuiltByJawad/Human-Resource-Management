
import { Router } from 'express';
import { authenticate, authorize } from '../../shared/middleware/auth';
import * as shiftController from './shift.controller';

const router = Router();

// Schedule (Admin/Manager)
router.post(
    '/',
    authenticate,
    authorize(['Super Admin', 'HR Admin', 'Manager']),
    shiftController.scheduleShift
);

// View Roster
router.get(
    '/',
    authenticate,
    shiftController.getRoster
);

// Swap Requests
router.post(
    '/swap',
    authenticate,
    shiftController.requestSwap
);

router.patch(
    '/swap/:id',
    authenticate,
    authorize(['Super Admin', 'HR Admin', 'Manager']),
    shiftController.updateSwapStatus
);

export default router;
