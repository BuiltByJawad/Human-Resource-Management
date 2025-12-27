import { Router } from 'express';
import {
  getAssets,
  createAsset,
  updateAsset,
  assignAsset,
  returnAsset,
  addMaintenanceLog,
  getAssetDetails,
  getEmployeeAssets,
  deleteAsset,
} from '../../controllers/assetController';
import { authenticate, checkPermission } from '../../shared/middleware/auth';

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
router.get('/', checkPermission('assets', 'view'), getAssets);

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
router.get('/employee/:employeeId', getEmployeeAssets);

router.get('/:id', checkPermission('assets', 'view'), getAssetDetails);

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
router.post('/', checkPermission('assets', 'manage'), createAsset);

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
router.put('/:id', checkPermission('assets', 'manage'), updateAsset);
router.patch('/:id', checkPermission('assets', 'manage'), updateAsset);

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
router.delete('/:id', checkPermission('assets', 'manage'), deleteAsset);

router.post('/:id/assign', checkPermission('assets', 'assign'), assignAsset);
router.post('/:id/return', checkPermission('assets', 'assign'), returnAsset);
router.post('/:id/maintenance', checkPermission('assets', 'manage'), addMaintenanceLog);

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
export default router;
