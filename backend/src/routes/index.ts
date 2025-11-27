import { Router } from 'express';
import authRoutes from './authRoutes';
import employeeRoutes from './employeeRoutes';
import departmentRoutes from './departmentRoutes';
import attendanceRoutes from './attendanceRoutes';
import leaveRoutes from './leaveRoutes';
import reportRoutes from './reportRoutes';
import roleRoutes from './roleRoutes';
import performanceRoutes from './performance.routes';
import dashboardRoutes from './dashboardRoutes';
import orgRoutes from './orgRoutes';

const router = Router();

router.use('/dashboard', dashboardRoutes);
router.use('/auth', authRoutes);
router.use('/employees', employeeRoutes);
router.use('/departments', departmentRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/leave', leaveRoutes);
router.use('/reports', reportRoutes);
router.use('/roles', roleRoutes);
console.log('Registering performance routes...');
router.use('/performance', performanceRoutes);
router.use('/org', orgRoutes);

export default router;
