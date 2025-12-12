import { Router } from 'express';
import * as complianceController from './compliance.controller';
import { authenticate } from '../../shared/middleware/auth';

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
router.get('/', complianceController.getAll);
router.get('/:id', complianceController.getById);
router.post('/', complianceController.create);
router.put('/:id', complianceController.update);
router.delete('/:id', complianceController.remove);

export default router;
