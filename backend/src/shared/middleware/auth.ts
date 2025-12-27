import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { UnauthorizedError, ForbiddenError } from '../utils/errors'
import { prisma } from '../config/database'

export interface AuthRequest extends Request {
  user?: {
    id: string
    email: string
    role: string
    permissions: string[]
    employeeId?: string
    organizationId?: string | null
  }
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '')

    if (!token) {
      throw new UnauthorizedError('No token provided')
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true
              }
            }
          }
        },
        employee: true
      }
    })

    if (!user || user.status !== 'active') {
      throw new UnauthorizedError('User not found or inactive')
    }

    const tokenOrgId = decoded?.organizationId as string | undefined
    const userOrgId = (user as any)?.organizationId as string | null | undefined

    if (userOrgId) {
      if (!tokenOrgId) {
        throw new UnauthorizedError('Invalid token (missing organization)')
      }
      if (tokenOrgId !== userOrgId) {
        throw new UnauthorizedError('Invalid token (organization mismatch)')
      }
    } else if (tokenOrgId) {
      throw new UnauthorizedError('Invalid token (user not assigned to organization)')
    }

    const permissions = user.role.permissions.map(rp => `${rp.permission.resource}.${rp.permission.action}`)

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role.name,
      permissions,
      employeeId: user.employee?.id,
      organizationId: userOrgId || null,
    }

    next()
  } catch (error: any) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new UnauthorizedError('Invalid token'))
    } else {
      next(error)
    }
  }
}

export const authorize = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError('User not authenticated'))
    }

    if (!roles.includes(req.user.role)) {
      return next(new ForbiddenError('Insufficient permissions'))
    }

    next()
  }
}

export const checkPermission = (resource: string, action: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError('User not authenticated'))
    }

    const requiredPermission = `${resource}.${action}`

    // Super Admin bypass
    if (req.user.role === 'Super Admin') {
      return next()
    }

    if (!req.user.permissions.includes(requiredPermission)) {
      return next(new ForbiddenError(`Missing permission: ${requiredPermission}`))
    }

    next()
  }
}

export const protect = authenticate