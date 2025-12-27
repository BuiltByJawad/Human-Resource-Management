import { Prisma } from '@prisma/client'
import { prisma } from '../../shared/config/database'
import { NotFoundError, ForbiddenError } from '../../shared/utils/errors'

export interface CreateNotificationInput {
  userId: string
  title?: string
  message?: string
  type?: string
  link?: string
}

class NotificationService {
  async listForUser(userId: string, opts?: { onlyUnread?: boolean }) {
    return prisma.notification.findMany({
      where: {
        userId,
        ...(opts?.onlyUnread ? { readAt: null } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
  }

  async markRead(id: string, userId: string) {
    const existing = await prisma.notification.findUnique({ where: { id } })
    if (!existing) throw new NotFoundError('Notification not found')
    if (existing.userId !== userId) throw new ForbiddenError('Cannot update this notification')

    return prisma.notification.update({
      where: { id },
      data: { readAt: new Date() } as Prisma.NotificationUncheckedUpdateInput,
    })
  }

  async markAllRead(userId: string) {
    await prisma.notification.updateMany({
      where: { userId, readAt: null } as Prisma.NotificationWhereInput,
      data: { readAt: new Date() } as Prisma.NotificationUncheckedUpdateManyInput,
    })
  }

  async create(input: CreateNotificationInput) {
    if (!input.userId) {
      throw new Error('userId is required for notification')
    }
    const title = input.title || 'Notification'
    const userId = input.userId as string
    return prisma.notification.create({
      data: {
        userId,
        title,
        message: input.message ?? null,
        type: input.type ?? null,
        link: input.link ?? null,
      } as Prisma.NotificationUncheckedCreateInput,
    })
  }
}

export const notificationService = new NotificationService()
