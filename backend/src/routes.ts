import { Router } from 'express';

// Import all module routes
import authRoutes from './modules/auth/auth.routes';
import employeeRoutes from './modules/employee/employee.routes';
import departmentRoutes from './modules/department/department.routes';
import roleRoutes from './modules/role/role.routes';
import leaveRoutes from './modules/leave/leave.routes';
import attendanceRoutes from './modules/attendance/attendance.routes';
import payrollRoutes from './modules/payroll/payroll.routes';
import benefitsRoutes from './modules/benefits/benefits.routes';
import expenseRoutes from './modules/expense/expense.routes';
import offboardingRoutes from './modules/offboarding/offboarding.routes';
import performanceRoutes from './modules/performance/performance.routes';
import recruitmentRoutes from './modules/recruitment/recruitment.routes';
import assetRoutes from './modules/asset/asset.routes';
import complianceRoutes from './modules/compliance/compliance.routes';
import analyticsRoutes from './modules/analytics/analytics.routes';
import organizationRoutes from './modules/organization/organization.routes';
import onboardingRoutes from './modules/onboarding/onboarding.routes';
import notificationRoutes from './modules/notification/notification.routes';

const router = Router();

// Register all routes
router.use('/auth', authRoutes);
router.use('/employees', employeeRoutes);
router.use('/departments', departmentRoutes);
router.use('/roles', roleRoutes);
router.use('/leave', leaveRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/payroll', payrollRoutes);
router.use('/benefits', benefitsRoutes);
router.use('/expenses', expenseRoutes);
router.use('/performance', performanceRoutes);
router.use('/recruitment', recruitmentRoutes);
router.use('/assets', assetRoutes);
router.use('/compliance', complianceRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/org', organizationRoutes);
router.use('/onboarding', onboardingRoutes);
router.use('/offboarding', offboardingRoutes);
router.use('/notifications', notificationRoutes);

export default router;
