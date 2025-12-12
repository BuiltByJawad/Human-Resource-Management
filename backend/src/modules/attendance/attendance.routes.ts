import { Router } from 'express';
import * as attendanceController from './attendance.controller';
import { authenticate } from '../../shared/middleware/auth';

/**
 * @swagger
 * tags:
 *   name: Attendance
 *   description: Attendance tracking with geofencing
 */

const router = Router();
router.use(authenticate);

router.get('/', attendanceController.getAll);
router.post('/check-in', attendanceController.checkIn);
router.post('/check-out', attendanceController.checkOut);

export default router;
