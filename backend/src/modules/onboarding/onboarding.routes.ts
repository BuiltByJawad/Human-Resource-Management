
import { Router } from 'express'
import { authenticate, authorize } from '../../shared/middleware/auth'
import * as onboardingController from './onboarding.controller'

const router = Router()

// Start or fetch process
router.post(
  '/process/:employeeId/start',
  authenticate,
  authorize(['Super Admin', 'HR Admin', 'Manager']),
  onboardingController.startProcess
)

router.get(
  '/process/:employeeId',
  authenticate,
  authorize(['Super Admin', 'HR Admin', 'Manager', 'Employee']),
  onboardingController.getProcess
)

// Tasks
router.post(
  '/process/:employeeId/tasks',
  authenticate,
  authorize(['Super Admin', 'HR Admin', 'Manager']),
  onboardingController.createTask
)

router.patch(
  '/tasks/:taskId',
  authenticate,
  authorize(['Super Admin', 'HR Admin', 'Manager']),
  onboardingController.updateTask
)

router.post(
  '/tasks/:taskId/complete',
  authenticate,
  authorize(['Super Admin', 'HR Admin', 'Manager', 'Employee']),
  onboardingController.completeTask
)

export default router
