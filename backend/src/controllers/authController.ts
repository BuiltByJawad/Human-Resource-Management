import { Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { addHours } from 'date-fns'
import { asyncHandler } from '../middleware/errorHandler'
import { prisma } from '../config/database'
import { comparePassword, generateTokens, hashPassword } from '../utils/auth'
import { UnauthorizedError, BadRequestError, NotFoundError } from '../utils/errors'
import { AuthRequest } from '../middleware/auth'
import { sendEmail } from '../utils/email'

const generateToken = (length = 32) => crypto.randomBytes(length).toString('hex')
const hashToken = (token: string) => crypto.createHash('sha256').update(token).digest('hex')

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

export const inviteUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { email, roleId, expiresInHours = 72 } = req.body

  if (!email || !roleId) {
    throw new BadRequestError('Email and roleId are required')
  }

  const role = await prisma.role.findUnique({ where: { id: roleId } })
  if (!role) {
    throw new NotFoundError('Role not found')
  }

  let user = await prisma.user.findUnique({ where: { email } })

  if (user && user.verified) {
    throw new BadRequestError('User is already active and verified')
  }

  if (!user) {
    const randomPassword = generateToken(16)
    const hashedRandomPassword = await hashPassword(randomPassword)

    user = await prisma.user.create({
      data: {
        email,
        password: hashedRandomPassword,
        roleId,
        status: 'active',
        verified: false,
      }
    })
  } else if (user.roleId !== roleId) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { roleId },
    })
  }

  await prisma.userInvite.deleteMany({ where: { OR: [{ email }, { userId: user.id }] } })

  const token = generateToken()
  const tokenHash = hashToken(token)

  const invite = await prisma.userInvite.create({
    data: {
      email,
      roleId,
      userId: user.id,
      tokenHash,
      expiresAt: addHours(new Date(), expiresInHours)
    }
  })

  await prisma.employee.updateMany({
    where: { email },
    data: { userId: user.id },
  })

  const inviteLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/accept-invite?token=${token}`

  // Fire-and-forget email sending; failure won't break API response
  sendEmail({
    to: email,
    subject: 'You have been invited to NovaHR',
    html: `
      <p>Hello,</p>
      <p>You have been invited to join the HRM system. Click the button below to set your password and activate your account:</p>
      <p><a href="${inviteLink}" style="display:inline-block;padding:8px 16px;border-radius:4px;background:#2563eb;color:#ffffff;text-decoration:none;">Accept invite</a></p>
      <p>If the button does not work, copy and paste this link into your browser:</p>
      <p><a href="${inviteLink}">${inviteLink}</a></p>
    `,
  }).catch(err => {
    console.error('Failed to send invite email', err)
  })

  res.status(201).json({
    success: true,
    data: {
      inviteId: invite.id,
      inviteLink
    },
    message: 'Invite generated. Share the link with the employee.'
  })
})

export const completeInvite = asyncHandler(async (req: Request, res: Response) => {
  const { token, password } = req.body

  if (!token || !password) {
    throw new BadRequestError('Token and password are required')
  }

  const invite = await prisma.userInvite.findFirst({
    where: {
      tokenHash: hashToken(token),
      acceptedAt: null,
      expiresAt: { gt: new Date() }
    },
    include: {
      user: true,
    }
  })

  if (!invite) {
    throw new BadRequestError('Invite is invalid or expired')
  }

  const hashedPassword = await hashPassword(password)
  let user = invite.user

  if (user) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        roleId: invite.roleId,
        status: 'active',
        verified: true,
      }
    })
  } else {
    const existingUser = await prisma.user.findUnique({ where: { email: invite.email } })
    if (existingUser) {
      user = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          password: hashedPassword,
          roleId: invite.roleId,
          status: 'active',
          verified: true,
        }
      })
    } else {
      user = await prisma.user.create({
        data: {
          email: invite.email,
          password: hashedPassword,
          roleId: invite.roleId,
          status: 'active',
          verified: true,
        }
      })
    }
  }

  await prisma.userInvite.update({
    where: { id: invite.id },
    data: { acceptedAt: new Date(), userId: user.id }
  })

  res.json({
    success: true,
    data: {
      userId: user.id,
      email: user.email
    }
  })
})

export const requestPasswordReset = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body
  if (!email) {
    throw new BadRequestError('Email is required')
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    return res.json({ success: true, message: 'If this email exists, a reset link will be sent.' })
  }

  if (!user.verified) {
    throw new BadRequestError('Account is not verified. Please activate your account from the invite email before resetting your password.')
  }

  const token = generateToken()
  const tokenHash = hashToken(token)

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt: addHours(new Date(), 2)
    }
  })

  const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/reset-password?token=${token}`

  // Fire-and-forget password reset email
  sendEmail({
    to: email,
    subject: 'Reset your NovaHR password',
    html: `
      <p>Hello,</p>
      <p>We received a request to reset the password for your HRM account. Click the button below to set a new password:</p>
      <p><a href="${resetLink}" style="display:inline-block;padding:8px 16px;border-radius:4px;background:#2563eb;color:#ffffff;text-decoration:none;">Reset password</a></p>
      <p>If you did not request this, you can safely ignore this email.</p>
      <p>If the button does not work, copy and paste this link into your browser:</p>
      <p><a href="${resetLink}">${resetLink}</a></p>
    `,
  }).catch(err => {
    console.error('Failed to send password reset email', err)
  })

  res.json({ success: true, data: { resetLink } })
})

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { token, password } = req.body
  if (!token || !password) {
    throw new BadRequestError('Token and password are required')
  }

  const tokenRecord = await prisma.passwordResetToken.findFirst({
    where: {
      tokenHash: hashToken(token),
      usedAt: null,
      expiresAt: { gt: new Date() }
    }
  })

  if (!tokenRecord) {
    throw new BadRequestError('Reset token is invalid or expired')
  }

  const hashedPassword = await hashPassword(password)

  await prisma.user.update({
    where: { id: tokenRecord.userId },
    data: { password: hashedPassword }
  })

  await prisma.passwordResetToken.update({
    where: { id: tokenRecord.id },
    data: { usedAt: new Date() }
  })

  res.json({ success: true, message: 'Password reset successfully' })
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
  const permissions = user.role.permissions.map((rp: { permission: { resource: string; action: string } }) => `${rp.permission.resource}.${rp.permission.action}`)

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