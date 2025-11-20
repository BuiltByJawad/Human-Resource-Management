import { Router } from 'express'
import { getEmployees, getEmployeeById, updateEmployee, deleteEmployee, createEmployee } from '../controllers/employeeController'
import { authenticate, checkPermission } from '../middleware/auth'
import { validateRequest } from '../middleware/validation'
import { employeeSchema } from '../validators'

const router = Router()

router.use(authenticate)

router.get('/', checkPermission('employees', 'read'), getEmployees)
router.get('/:id', checkPermission('employees', 'read'), getEmployeeById)
router.post('/', checkPermission('employees', 'create'), validateRequest(employeeSchema), createEmployee)
router.patch('/:id', checkPermission('employees', 'update'), updateEmployee)
router.delete('/:id', checkPermission('employees', 'delete'), deleteEmployee)

export default router