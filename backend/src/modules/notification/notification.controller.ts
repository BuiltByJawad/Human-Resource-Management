import { Request, Response } from 'express'
import { asyncHandler } from '../../shared/utils/async-handler'
import { notificationService } from './notification.service'

export const listMyNotifications = asyncHandler(async (req: any, res: Response) => {
  const onlyUnread = req.query.unread === 'true'
  const items = await notificationService.listForUser(req.user.id, { onlyUnread })
  res.json({ success: true, data: items })
})

export const markRead = asyncHandler(async (req: any, res: Response) => {
  const updated = await notificationService.markRead(req.params.id, req.user.id)
  res.json({ success: true, data: updated })
})

export const markAllRead = asyncHandler(async (req: any, res: Response) => {
  await notificationService.markAllRead(req.user.id)
  res.json({ success: true, message: 'All notifications marked as read' })
})

export const createNotification = asyncHandler(async (req: Request, res: Response) => {
  const { userId, title, message, type, link } = req.body
  const created = await notificationService.create({ userId, title, message, type, link })
  res.status(201).json({ success: true, data: created })
})
