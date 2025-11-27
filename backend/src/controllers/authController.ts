import { Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { asyncHandler } from '../middleware/errorHandler'
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
        createdAt: user.createdAt,
        employee: user.employee // Include employee details
      },
      permissions
    },
  })
})

export const uploadAvatar = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.file) {
    throw new BadRequestError('No file uploaded')
  }

  // Cloudinary storage puts the URL in req.file.path
  const avatarUrl = req.file.path

  const user = await prisma.user.update({
    where: { id: req.user!.id },
    data: { avatarUrl }
  })

  res.json({
    success: true,
    data: {
      avatarUrl: user.avatarUrl
    }
  })
})

export const changePassword = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { currentPassword, newPassword } = req.body

  if (!currentPassword || !newPassword) {
    throw new BadRequestError('Current password and new password are required')
  }

  if (newPassword.length < 6) {
    throw new BadRequestError('New password must be at least 6 characters long')
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user!.id }
  })

  if (!user) {
    throw new UnauthorizedError('User not found')
  }

  const isPasswordValid = await comparePassword(currentPassword, user.password)
  if (!isPasswordValid) {
    throw new BadRequestError('Current password is incorrect')
  }

  const hashedPassword = await hashPassword(newPassword)

  await prisma.user.update({
    where: { id: req.user!.id },
    data: { password: hashedPassword }
  })

  res.json({
    success: true,
    message: 'Password changed successfully'
  })
})

export const updateProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const {
    firstName,
    lastName,
    phoneNumber,
    address,
    dateOfBirth,
    gender,
    maritalStatus,
    emergencyContact
  } = req.body

  // Fetch current user to get existing details if not provided
  const currentUser = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!currentUser) throw new UnauthorizedError('User not found');

  // Update User basic info if provided
  if (firstName || lastName) {
    await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        firstName: firstName || undefined,
        lastName: lastName || undefined
      }
    })
  }

  // Use provided values or fallback to current user values
  const finalFirstName = firstName || currentUser.firstName || '';
  const finalLastName = lastName || currentUser.lastName || '';

  // Upsert Employee record
  const employeeData: any = {
    userId: req.user!.id,
    email: req.user!.email,
    firstName: finalFirstName,
    lastName: finalLastName,
    employeeNumber: `EMP-${Date.now()}`, // Simple generation for now
    hireDate: new Date(),
    salary: 0,
    phoneNumber,
    address,
    dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
    gender: gender || undefined,
    maritalStatus: maritalStatus || undefined,
    emergencyContact
  }

  const employee = await prisma.employee.upsert({
    where: { userId: req.user!.id },
    create: employeeData,
    update: {
      firstName: finalFirstName,
      lastName: finalLastName,
      phoneNumber,
      address,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      gender: gender || undefined,
      maritalStatus: maritalStatus || undefined,
      emergencyContact
    }
  })

  res.json({
    success: true,
    data: {
      user: {
        firstName: finalFirstName,
        lastName: finalLastName,
      },
      employee
    }
  })
})