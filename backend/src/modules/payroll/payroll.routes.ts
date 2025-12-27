import { Router } from 'express';
import * as payrollController from './payroll.controller';
import { authenticate, checkPermission } from '../../shared/middleware/auth';

/**
 * @swagger
 * tags:
 *   name: Payroll
 *   description: Payroll management and salary processing
 */

const router = Router();

router.use(authenticate);

router.get('/payslips/:employeeId?', payrollController.getEmployeePayslips);

router.get('/summary/:payPeriod', checkPermission('payroll', 'view'), payrollController.getPeriodSummary);

router.post('/generate', checkPermission('payroll', 'generate'), payrollController.generate);

/**
 * @swagger
 * /payroll:
 *   get:
 *     summary: Get all payroll records
 *     tags: [Payroll]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: payPeriod
 *         schema: {type: string}
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, approved, paid]
 *     responses:
 *       200:
 *         description: List of payroll records
 */
router.get('/', checkPermission('payroll', 'view'), payrollController.getAll);

/**
 * @swagger
 * /payroll/{id}:
 *   get:
 *     summary: Get payroll record by ID
 *     tags: [Payroll]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: {type: string}
 *     responses:
 *       200:
 *         description: Payroll record details
 */
router.get('/:id', checkPermission('payroll', 'view'), payrollController.getById);

/**
 * @swagger
 * /payroll/generate:
 *   post:
 *     summary: Generate payroll for a period
 *     tags: [Payroll]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [payPeriod]
 *             properties:
 *               payPeriod:
 *                 type: string
 *                 example: "2024-01"
 *     responses:
 *       201:
 *         description: Payroll generated
 */
/**
 * @swagger
 * /payroll/{id}/status:
 *   put:
 *     summary: Update payroll status
 *     tags: [Payroll]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: {type: string}
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [draft, approved, paid]
 *     responses:
 *       200:
 *         description: Status updated
 */
router.put('/:id/status', checkPermission('payroll', 'manage'), payrollController.updateStatus);

/**
 * @swagger
 * /payroll/payslips/{employeeId}:
 *   get:
 *     summary: Get employee payslips
 *     tags: [Payroll]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: employeeId
 *         schema: {type: string}
 *     responses:
 *       200:
 *         description: Employee payslips
 */
/**
 * @swagger
 * /payroll/summary/{payPeriod}:
 *   get:
 *     summary: Get payroll summary for a period
 *     tags: [Payroll]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: payPeriod
 *         required: true
 *         schema: {type: string}
 *     responses:
 *       200:
 *         description: Payroll summary
 */
export default router;
