import { Router } from 'express'
import { getRules, createRule, toggleRule, getLogs, runComplianceCheck } from '../controllers/complianceController'
import { authenticate, authorize } from '@/shared/middleware/auth';

const router = Router()

router.use(authenticate)

router.get('/rules', getRules)
router.post('/rules', authorize(['compliance.manage']), createRule)
router.patch('/rules/:id/toggle', authorize(['compliance.manage']), toggleRule)

router.get('/logs', getLogs)
router.post('/run', authorize(['compliance.manage']), runComplianceCheck)

export default router
