import { Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { asyncHandler } from '../middleware/errorHandler'
import { loginSchema } from '../validators'
import { prisma } from '../config/database'
import { comparePassword, generateTokens } from '../utils/auth'
import { UnauthorizedError } from '../utils/errors'
import { AuthRequest } from '../middleware/auth'

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body
  
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      password: true,
      role: true,
      isActive: true,
    },
  })
  
  if (!user || !user.isActive) {
    throw new UnauthorizedError('Invalid credentials')
  }
  
  const isPasswordValid = await comparePassword(password, user.password)
  if (!isPasswordValid) {
    throw new UnauthorizedError('Invalid credentials')
  }
  
  const { accessToken, refreshToken } = generateTokens(user.id, user.email, user.role)
  
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLogin: new Date() },
  })
  
  res.json({
    success: true,
    data: {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      permissions: getUserPermissions(user.role),
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
      select: { id: true, email: true, role: true, isActive: true },
    })
    
    if (!user || !user.isActive) {
      throw new UnauthorizedError('User not found or inactive')
    }
    
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user.id, user.email, user.role)
    
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
    select: {
      id: true,
      email: true,
      role: true,
      isActive: true,
      lastLogin: true,
      createdAt: true,
    },
  })
  
  res.json({
    success: true,
    data: { user },
  })
})

const getUserPermissions = (role: string): string[] => {
  const permissions: Record<string, string[]> = {
    super_admin: ['*'],
    hr_admin: [
      'employees.create',
      'employees.read',
      'employees.update',
      'employees.delete',
      'departments.manage',
      'leave.manage',
      'payroll.manage',
      'reports.generate',
    ],
    manager: [
      'employees.read',
      'employees.update',
      'leave.approve',
      'performance.review',
      'reports.team',
    ],
    employee: [
      'profile.read',
      'profile.update',
      'leave.request',
      'attendance.view',
    ],
  }
  
  return permissions[role] || []
}