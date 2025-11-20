import { Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { asyncHandler } from '../middleware/errorHandler'
import { loginSchema } from '../validators'
import { prisma } from '../config/database'
import { comparePassword, generateTokens, hashPassword } from '../utils/auth'
import { UnauthorizedError, BadRequestError } from '../utils/errors'
import { AuthRequest } from '../middleware/auth'

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, firstName, lastName } = req.body

  const existingUser = await prisma.user.findUnique({ where: { email } })
  if (existingUser) {
    throw new BadRequestError('Email already in use')
  }

  // Find default role (e.g., 'Employee') or create if not exists (for dev/seed)
  let defaultRole = await prisma.role.findUnique({ where: { name: 'Employee' } })
  if (!defaultRole) {
    // Fallback for initial setup, though seeding is preferred
    defaultRole = await prisma.role.create({
      data: { name: 'Employee', description: 'Standard employee role' }
    })
  }

  const hashedPassword = await hashPassword(password)

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      firstName,
      lastName,
      roleId: defaultRole.id,
      status: 'active'
    },
    include: {
      role: true
    }
  })

  const { accessToken, refreshToken } = generateTokens(user.id, user.email, user.role.name)

  res.status(201).json({
    success: true,
    data: {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role.name,
      }
    }
  })
})

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body

  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      role: {
        include: {
          permissions: {
            include: {
              permission: true
            }
          }
        }
      }
    }
  })

  if (!user || user.status !== 'active') {
    throw new UnauthorizedError('Invalid credentials or inactive account')
  }

  const isPasswordValid = await comparePassword(password, user.password)
  if (!isPasswordValid) {
    throw new UnauthorizedError('Invalid credentials')
  }

  const { accessToken, refreshToken } = generateTokens(user.id, user.email, user.role.name)

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLogin: new Date() },
  })

  // Flatten permissions
  const permissions = user.role.permissions.map(rp => `${rp.permission.resource}.${rp.permission.action}`)

  res.json({
    success: true,
    data: {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role.name,
        avatarUrl: user.avatarUrl
      },
      permissions,
    },
  })
})

export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body

  if (!refreshToken) {
    throw new UnauthorizedError('Refresh token required')
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as any

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { role: true }
    })

    if (!user || user.status !== 'active') {
      throw new UnauthorizedError('User not found or inactive')
    }

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user.id, user.email, user.role.name)

    res.json({
      success: true,
      data: {
        accessToken,
        refreshToken: newRefreshToken,
      },
    })
  } catch (error) {
    throw new UnauthorizedError('Invalid refresh token')
  }
})

export const getProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
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
      department: true,
      employee: true
    }
  })

  if (!user) {
    throw new UnauthorizedError('User not found')
  }

  const permissions = user.role.permissions.map(rp => `${rp.permission.resource}.${rp.permission.action}`)

  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role.name,
        department: user.department?.name,
        avatarUrl: user.avatarUrl,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
      },
      permissions
    },
  })
})