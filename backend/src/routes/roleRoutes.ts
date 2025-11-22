import { Router } from 'express'
import {
  createRole,
  getRoles,
  getRoleById,
  updateRole,
  deleteRole,
  getPermissions
} from '../controllers/roleController'
import { authenticate, authorize } from '../middleware/auth'
import { validateRequest } from '../middleware/validation'
import Joi from 'joi'

const router = Router()

const createRoleSchema = Joi.object({
  name: Joi.string().required().min(2).max(50),
  description: Joi.string().allow('', null).max(200),
  permissionIds: Joi.array().items(Joi.string().uuid()).optional()
})

const updateRoleSchema = Joi.object({
  name: Joi.string().min(2).max(50),
  description: Joi.string().allow('', null).max(200),
  permissionIds: Joi.array().items(Joi.string().uuid()).optional()
})

// Public/Protected routes
router.get('/permissions', authenticate, getPermissions)

router.route('/')
  .post(authenticate, authorize(['Super Admin', 'Admin']), validateRequest(createRoleSchema), createRole)
  .get(authenticate, getRoles)

router.route('/:id')
  .get(authenticate, getRoleById)
  .put(authenticate, authorize(['Super Admin', 'Admin']), validateRequest(updateRoleSchema), updateRole)
  .delete(authenticate, authorize(['Super Admin', 'Admin']), deleteRole)

export default router