import { Router } from 'express';
import * as portalController from './portal.controller';
import { authenticate } from '../../shared/middleware/auth';

/**
 * @swagger
 * tags:
 *   name: Employee Portal
 *   description: Employee self-service features
 */

const router = Router();
router.use(authenticate);

/**
 * @swagger
 * /portal/profile:
 *   get:
 *     summary: Get employee profile
 *     tags: [Employee Portal]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Employee profile
 */
router.get('/profile', portalController.getProfile);

/**
 * @swagger
 * /portal/profile:
 *   put:
 *     summary: Update profile
 *     tags: [Employee Portal]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName: {type: string}
 *               lastName: {type: string}
 *               phone: {type: string}
 *               address: {type: string}
 *     responses:
 *       200:
 *         description: Profile updated
 */
router.put('/profile', portalController.updateProfile);

/**
 * @swagger
 * /portal/paystubs:
 *   get:
 *     summary: Get paystubs
 *     tags: [Employee Portal]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of paystubs
 */
router.get('/paystubs', portalController.getPaystubs);

/**
 * @swagger
 * /portal/time-off:
 *   get:
 *     summary: Get time-off requests
 *     tags: [Employee Portal]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Time-off requests
 */
router.get('/time-off', portalController.getTimeOff);

/**
 * @swagger
 * /portal/documents:
 *   get:
 *     summary: Get documents
 *     tags: [Employee Portal]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Employee documents
 */
router.get('/documents', portalController.getDocuments);

/**
 * @swagger
 * /portal/documents:
 *   post:
 *     summary: Upload document
 *     tags: [Employee Portal]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Document uploaded
 */
router.post('/documents', portalController.uploadDocument);

/**
 * @swagger
 * /portal/emergency-contacts:
 *   get:
 *     summary: Get emergency contacts
 *     tags: [Employee Portal]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Emergency contacts
 */
router.get('/emergency-contacts', portalController.getEmergencyContacts);
router.post('/emergency-contacts', portalController.addEmergencyContact);
router.put('/emergency-contacts/:id', portalController.updateEmergencyContact);
router.delete('/emergency-contacts/:id', portalController.deleteEmergencyContact);

/**
 * @swagger
 * /portal/directory:
 *   get:
 *     summary: Get company directory
 *     tags: [Employee Portal]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Employee directory
 */
router.get('/directory', portalController.getDirectory);

export default router;
