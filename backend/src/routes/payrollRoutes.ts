import { Router } from 'express';
import { generatePayroll, getPayrollRecords, updatePayrollStatus, getEmployeePayslips } from '../controllers/payrollController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Admin routes
router.post('/generate', authenticate, authorize(['admin', 'hr_manager']), generatePayroll);
router.get('/', authenticate, authorize(['admin', 'hr_manager']), getPayrollRecords);
router.patch('/:id/status', authenticate, authorize(['admin', 'hr_manager']), updatePayrollStatus);

// Employee routes
router.get('/my-payslips', authenticate, getEmployeePayslips);

export default router;
