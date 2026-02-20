import { Router } from 'express'
import * as controller from './document-category.controller'
import { authenticate, checkPermission } from '../../shared/middleware/auth'

const router = Router()

router.use(authenticate)

router.get('/', controller.list)
router.get('/:id', controller.getById)
router.post('/', checkPermission('document_categories', 'manage'), controller.create)
router.patch('/:id', checkPermission('document_categories', 'manage'), controller.update)
router.delete('/:id', checkPermission('document_categories', 'manage'), controller.remove)

export default router
