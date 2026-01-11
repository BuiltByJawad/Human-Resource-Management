import { Request } from 'express'
import { prisma } from '../config/database'
import { logger } from '../config/logger'
import { Prisma } from '@prisma/client'

interface AuditLogInput {
  userId: string
  action: string
  resourceId?: string
  oldValues?: Prisma.InputJsonValue
  newValues?: Prisma.InputJsonValue
  req?: Request
}

export const createAuditLog = async ({
  userId,
  action,
  resourceId,
  oldValues,
  newValues,
  req,
}: AuditLogInput) => {
  try {
    const ipAddress = req?.ip
    const userAgent = req?.get('user-agent') ?? undefined

    await prisma.auditLog.create({
      data: {
        userId,
        action,
        resourceId: resourceId ?? null,
        oldValues: oldValues === undefined ? undefined : oldValues,
        newValues: newValues === undefined ? undefined : newValues,
        ipAddress: ipAddress ?? null,
        userAgent: userAgent ?? null,
      },
    })
  } catch (error) {
    // Audit logging should never break the main request flow
    logger.warn('Failed to create audit log', { error, userId, action, resourceId })
  }
}
