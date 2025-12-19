import { Router } from 'express'
import { getRules, createRule, toggleRule, getLogs, runComplianceCheck } from '@/controllers/complianceController'
import { authenticate, checkPermission } from '../shared/middleware/auth'

const router = Router()

router.use(authenticate)

router.get('/rules', getRules)
router.post('/rules', checkPermission('compliance', 'manage'), createRule)
router.patch('/rules/:id/toggle', checkPermission('compliance', 'manage'), toggleRule)

router.get('/logs', getLogs)
router.post('/run', checkPermission('compliance', 'manage'), runComplianceCheck)

export default router
