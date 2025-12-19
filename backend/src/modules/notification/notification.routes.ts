import { Router } from 'express'
import { authenticate, checkPermission } from '../../shared/middleware/auth'
import { listMyNotifications, markRead, markAllRead, createNotification } from './notification.controller'

const router = Router()

// All notification routes require authentication
router.use(authenticate)

router.get('/', checkPermission('notifications', 'update_own_notifications'), listMyNotifications)
router.post('/', checkPermission('notifications', 'manage'), createNotification)
router.post('/mark-all-read', checkPermission('notifications', 'update_own_notifications'), markAllRead)
router.patch('/:id/read', checkPermission('notifications', 'update_own_notifications'), markRead)

export default router
