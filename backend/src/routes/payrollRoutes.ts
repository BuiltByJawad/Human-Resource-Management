import { Router } from 'express';
import { generatePayroll, getPayrollRecords, updatePayrollStatus, getEmployeePayslips } from '../controllers/payrollController';
import { authenticate, authorize } from '@/shared/middleware/auth';

const router = Router();

// Admin routes
router.post('/generate', authenticate, authorize(['Super Admin', 'HR Admin']), generatePayroll);
router.get('/', authenticate, authorize(['Super Admin', 'HR Admin']), getPayrollRecords);
router.patch('/:id/status', authenticate, authorize(['Super Admin', 'HR Admin']), updatePayrollStatus);

// Employee routes
router.get('/my-payslips', authenticate, getEmployeePayslips);

export default router;
