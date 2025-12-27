import { Router } from 'express'
import Joi from 'joi'
import { getEmployees, getEmployeeById, updateEmployee, deleteEmployee, createEmployee } from '@/controllers/employeeController'
import { authenticate, checkPermission } from '@/shared/middleware/auth'
import { validateRequest, validateParams } from '@/shared/middleware/validation'
import { employeeSchema, employeeUpdateSchema } from '@/validators'

const router = Router()

const idParamsSchema = Joi.object({
  id: Joi.string().uuid().required(),
})

router.use(authenticate)

router.get('/', checkPermission('employees', 'read'), getEmployees)
router.get('/:id', checkPermission('employees', 'read'), validateParams(idParamsSchema), getEmployeeById)
router.post('/', checkPermission('employees', 'create'), validateRequest(employeeSchema), createEmployee)
router.patch('/:id', checkPermission('employees', 'update'), validateParams(idParamsSchema), validateRequest(employeeUpdateSchema), updateEmployee)
router.delete('/:id', checkPermission('employees', 'delete'), validateParams(idParamsSchema), deleteEmployee)

export default router