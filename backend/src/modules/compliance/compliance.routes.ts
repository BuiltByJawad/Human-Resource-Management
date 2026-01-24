import { Router } from 'express';
import * as complianceController from './compliance.controller';
import * as legacyComplianceController from '../../controllers/complianceController';
import { authenticate, checkPermission } from '../../shared/middleware/auth';

/**
 * @swagger
 * tags:
 *   name: Compliance
 *   description: Compliance tracking and management
 */

const router = Router();
router.use(authenticate);

/**
 * @swagger
 * /compliance:
 *   get:
 *     summary: Get all compliance records
 *     tags: [Compliance]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of compliance records
 */
// Legacy-style compliance rule/log/run endpoints used by frontend (must come before :id route)
router.get('/rules', legacyComplianceController.getRules);
router.post('/rules', checkPermission('compliance', 'manage'), legacyComplianceController.createRule);
router.patch('/rules/:id/toggle', checkPermission('compliance', 'manage'), legacyComplianceController.toggleRule);

router.get('/logs', legacyComplianceController.getLogs);
router.post('/run', checkPermission('compliance', 'manage'), legacyComplianceController.runComplianceCheck);


// CRUD for compliance records
router.get('/', complianceController.getAll);
router.get('/:id', complianceController.getById);
router.post('/', complianceController.create);
router.put('/:id', complianceController.update);
router.delete('/:id', complianceController.remove);

export default router;
