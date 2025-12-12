import { Router } from 'express';
import * as assetController from './asset.controller';
import { authenticate } from '../../shared/middleware/auth';

/**
 * @swagger
 * tags:
 *   name: Assets
 *   description: Asset management and tracking
 */

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /assets:
 *   get:
 *     summary: Get all assets
 *     tags: [Assets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [available, assigned, maintenance, retired]
 *       - in: query
 *         name: assetType
 *         schema: {type: string}
 *       - in: query
 *         name: search
 *         schema: {type: string}
 *     responses:
 *       200:
 *         description: List of assets
 */
router.get('/', assetController.getAll);

/**
 * @swagger
 * /assets/{id}:
 *   get:
 *     summary: Get asset by ID
 *     tags: [Assets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: {type: string}
 *     responses:
 *       200:
 *         description: Asset details
 */
router.get('/:id', assetController.getById);

/**
 * @swagger
 * /assets:
 *   post:
 *     summary: Create new asset
 *     tags: [Assets]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, assetType]
 *             properties:
 *               name: {type: string}
 *               assetType: {type: string}
 *               serialNumber: {type: string}
 *               purchaseDate: {type: string, format: date}
 *               purchaseCost: {type: number}
 *               assignedTo: {type: string}
 *     responses:
 *       201:
 *         description: Asset created
 */
router.post('/', assetController.create);

/**
 * @swagger
 * /assets/{id}:
 *   put:
 *     summary: Update asset
 *     tags: [Assets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: {type: string}
 *     responses:
 *       200:
 *         description: Asset updated
 */
router.put('/:id', assetController.update);

/**
 * @swagger
 * /assets/{id}:
 *   delete:
 *     summary: Delete asset
 *     tags: [Assets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: {type: string}
 *     responses:
 *       200:
 *         description: Asset deleted
 */
router.delete('/:id', assetController.remove);

/**
 * @swagger
 * /assets/employee/{employeeId}:
 *   get:
 *     summary: Get assets assigned to employee
 *     tags: [Assets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: employeeId
 *         required: true
 *         schema: {type: string}
 *     responses:
 *       200:
 *         description: Employee assets
 */
router.get('/employee/:employeeId', assetController.getEmployeeAssets);

export default router;
