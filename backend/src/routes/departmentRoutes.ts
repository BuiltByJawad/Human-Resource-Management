import { Router } from 'express'
import {
  createDepartment,
  getDepartments,
  getDepartmentById,
  updateDepartment,
  deleteDepartment
} from '../controllers/departmentController'
import { authenticate, authorize } from '@/shared/middleware/auth';
import { validateRequest } from '@/shared/middleware/validation';
import Joi from 'joi'

const router = Router()

const createDepartmentSchema = Joi.object({
  name: Joi.string().required().min(2).max(100),
  description: Joi.string().allow('', null).max(500),
  managerId: Joi.string().uuid().allow(null, '').empty('').default(null),
  parentDepartmentId: Joi.string().uuid().allow(null, '').empty('').default(null)
})

const updateDepartmentSchema = Joi.object({
  name: Joi.string().min(2).max(100),
  description: Joi.string().allow('', null).max(500),
  managerId: Joi.string().uuid().allow(null, '').empty(''),
  parentDepartmentId: Joi.string().uuid().allow(null, '').empty('')
})

router.route('/')
  .post(authenticate, authorize(['Super Admin', 'Admin']), validateRequest(createDepartmentSchema), createDepartment)
  .get(authenticate, getDepartments)

router.route('/:id')
  .get(authenticate, getDepartmentById)
  .put(authenticate, authorize(['Super Admin', 'Admin']), validateRequest(updateDepartmentSchema), updateDepartment)
  .delete(authenticate, authorize(['Super Admin', 'Admin']), deleteDepartment)

export default router