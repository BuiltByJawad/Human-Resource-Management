import { Router } from 'express';
import * as leaveController from './leave.controller';
import { authenticate } from '../../shared/middleware/auth';

/**
 * @swagger
 * tags:
 *   name: Leave
 *   description: Leave request management and approvals
 */

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /leave:
 *   get:
 *     summary: Get all leave requests
 *     tags: [Leave]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: {type: integer}
 *       - in: query
 *         name: limit
 *         schema: {type: integer}
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected, cancelled]
 *       - in: query
 *         name: employeeId
 *         schema: {type: string}
 *     responses:
 *       200:
 *         description: List of leave requests
 */
router.get('/', leaveController.getAll);

/**
 * @swagger
 * /leave/{id}:
 *   get:
 *     summary: Get leave request by ID
 *     tags: [Leave]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: {type: string}
 *     responses:
 *       200:
 *         description: Leave request details
 */
router.get('/:id', leaveController.getById);

/**
 * @swagger
 * /leave:
 *   post:
 *     summary: Create leave request
 *     tags: [Leave]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [leaveType, startDate, endDate, reason]
 *             properties:
 *               leaveType: {type: string}
 *               startDate: {type: string, format: date}
 *               endDate: {type: string, format: date}
 *               reason: {type: string}
 *               emergencyContact: {type: string}
 *     responses:
 *       201:
 *         description: Leave request created
 */
router.post('/', leaveController.create);

/**
 * @swagger
 * /leave/{id}:
 *   put:
 *     summary: Update leave request
 *     tags: [Leave]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: {type: string}
 *     responses:
 *       200:
 *         description: Leave request updated
 */
router.put('/:id', leaveController.update);

/**
 * @swagger
 * /leave/{id}/approve:
 *   put:
 *     summary: Approve leave request
 *     tags: [Leave]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: {type: string}
 *     responses:
 *       200:
 *         description: Leave approved
 */
router.put('/:id/approve', leaveController.approve);

/**
 * @swagger
 * /leave/{id}/reject:
 *   put:
 *     summary: Reject leave request
 *     tags: [Leave]
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
 *             required: [reason]
 *             properties:
 *               reason: {type: string}
 *     responses:
 *       200:
 *         description: Leave rejected
 */
router.put('/:id/reject', leaveController.reject);

/**
 * @swagger
 * /leave/{id}/cancel:
 *   put:
 *     summary: Cancel leave request
 *     tags: [Leave]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: {type: string}
 *     responses:
 *       200:
 *         description: Leave cancelled
 */
router.put('/:id/cancel', leaveController.cancel);

/**
 * @swagger
 * /leave/balance/{employeeId}:
 *   get:
 *     summary: Get employee leave balance
 *     tags: [Leave]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: employeeId
 *         schema: {type: string}
 *     responses:
 *       200:
 *         description: Leave balance
 */
router.get('/balance/:employeeId?', leaveController.getBalance);

export default router;
