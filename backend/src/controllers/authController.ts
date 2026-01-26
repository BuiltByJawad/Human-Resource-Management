import { Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { addHours } from 'date-fns'
import { asyncHandler } from '@/shared/middleware/errorHandler'
import { prisma, redis, logger } from '@/shared/config/database'
import { comparePassword, generateTokens, hashPassword, validatePasswordStrength } from '@/shared/utils/auth'
import { UnauthorizedError, BadRequestError, NotFoundError } from '@/shared/utils/errors'
import { AuthRequest } from '@/shared/middleware/auth'
import { sendEmail } from '@/shared/utils/email'
import { createAuditLog } from '@/shared/utils/audit'
import { authService } from '@/modules/auth/auth.service'
import config from '@/shared/config/config'

const generateToken = (length = 32) => crypto.randomBytes(length).toString('hex')
const hashToken = (token: string) => crypto.createHash('sha256').update(token).digest('hex')

const normalizeEmail = (value: unknown): string => {
  if (typeof value !== 'string') return ''
  return value.trim().toLowerCase()
}

const getClientIp = (req: Request): string => {
  // trust proxy is enabled in app.ts; req.ip will respect X-Forwarded-For
  return typeof req.ip === 'string' && req.ip.length > 0 ? req.ip : 'unknown'
}

const ensureRedisConnected = async (): Promise<boolean> => {
  try {
    if (redis.isOpen) return true
    await redis.connect()
    return true
  } catch (error) {
    logger.warn('Redis unavailable for login lockout, continuing without lockout', { error })
    return false
  }
}

const getLockoutConfig = () => {
  const isProd = process.env.NODE_ENV === 'production'
  return {
    maxAttempts: isProd ? 5 : 10,
    windowSeconds: isProd ? 15 * 60 : 5 * 60,
    blockSeconds: isProd ? 15 * 60 : 5 * 60,
  }
}

const lockoutKeys = (ip: string, email: string) => {
  const safeEmail = email || 'unknown'
  const safeIp = ip || 'unknown'
  return {
    failKey: `auth:login:fail:${safeIp}:${safeEmail}`,
    blockKey: `auth:login:block:${safeIp}:${safeEmail}`,
  }
}

const isBlocked = async (blockKey: string): Promise<boolean> => {
  try {
    const ttl = await redis.ttl(blockKey)
    return typeof ttl === 'number' && ttl > 0
  } catch {
    return false
  }
}

const recordLoginFailure = async (failKey: string, blockKey: string) => {
  const { maxAttempts, windowSeconds, blockSeconds } = getLockoutConfig()
  try {
    const attempts = await redis.incr(failKey)
    if (attempts === 1) {
      await redis.expire(failKey, windowSeconds)
    }
    if (attempts >= maxAttempts) {
      await redis.set(blockKey, '1', { EX: blockSeconds })
    }
  } catch {
    // never block auth flow if redis ops fail
  }
}

const clearLoginFailures = async (failKey: string, blockKey: string) => {
  try {
    await redis.del(failKey)
    await redis.del(blockKey)
  } catch {
    // ignore
  }
}

const storeRefreshJti = async (userId: string, jti: string) => {
  const refreshDays =
    typeof config.jwt.refreshExpirationDays === 'number' && Number.isFinite(config.jwt.refreshExpirationDays)
      ? config.jwt.refreshExpirationDays
      : 7
  const ttlSeconds = Math.max(1, Math.floor(refreshDays * 24 * 60 * 60))
  try {
    await redis.set(`auth:refresh:jti:${userId}:${jti}`, '1', { EX: ttlSeconds })
  } catch {
    // ignore
  }
}

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

  const tokens = generateTokens(user.id, user.email, user.role.name)
  const { accessToken, refreshToken } = tokens

  const redisOk = await ensureRedisConnected()
  if (redisOk && typeof tokens.refreshTokenJti === 'string') {
    await storeRefreshJti(user.id, tokens.refreshTokenJti)
  }

  // Audit: user self-registered
  await createAuditLog({
    userId: user.id,
    action: 'auth.register',
    resourceId: user.id,
  })

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

  // Audit: user completed invite
  await createAuditLog({
    userId: user.id,
    action: 'auth.complete_invite',
    resourceId: user.id,
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

  // Use the existing employee record as a default source of name information
  const employeeForEmail = await prisma.employee.findFirst({ where: { email } })

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
        // Default name from employee record, if present
        firstName: employeeForEmail?.firstName ?? null,
        lastName: employeeForEmail?.lastName ?? null,
      }
    })
  } else {
    const updateData: any = {}

    if (user.roleId !== roleId) {
      updateData.roleId = roleId
    }

    // If the user does not yet have a name, default it from the employee record
    if ((!user.firstName && employeeForEmail?.firstName) || (!user.lastName && employeeForEmail?.lastName)) {
      updateData.firstName = user.firstName ?? employeeForEmail?.firstName ?? null
      updateData.lastName = user.lastName ?? employeeForEmail?.lastName ?? null
    }

    if (Object.keys(updateData).length > 0) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: updateData,
      })
    }
  }

  await prisma.userInvite.deleteMany({ where: { acceptedAt: null, OR: [{ email }, { userId: user.id }] } })

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

  const settings = await prisma.companySettings.findFirst({ select: { siteName: true } })
  const siteName = settings?.siteName || 'NovaHR'

  // Fire-and-forget email sending; failure won't break API response
  sendEmail({
    to: email,
    subject: `You have been invited to ${siteName}`,
    html: `
      <p>Hello,</p>
      <p>You have been invited to join ${siteName}. Click the button below to set your password and activate your account:</p>
      <p><a href="${inviteLink}" style="display:inline-block;padding:8px 16px;border-radius:4px;background:#2563eb;color:#ffffff;text-decoration:none;">Accept invite</a></p>
      <p>If the button does not work, copy and paste this link into your browser:</p>
      <p><a href="${inviteLink}">${inviteLink}</a></p>
    `,
  }).catch(err => {
    console.error('Failed to send invite email', err)
  })

  // Audit: admin invited user
  await createAuditLog({
    userId: req.user!.id,
    action: 'auth.invite_user',
    resourceId: user.id,
    newValues: { email, roleId },
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

  const passwordError = validatePasswordStrength(password)
  if (passwordError) {
    throw new BadRequestError(passwordError)
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

  // Audit: user completed invite
  await createAuditLog({
    userId: user.id,
    action: 'auth.complete_invite',
    resourceId: user.id,
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

  const settings = await prisma.companySettings.findFirst({ select: { siteName: true } })
  const siteName = settings?.siteName || 'NovaHR'

  // Fire-and-forget password reset email
  sendEmail({
    to: email,
    subject: `Reset your ${siteName} password`,
    html: `
      <p>Hello,</p>
      <p>We received a request to reset the password for your ${siteName} account. Click the button below to set a new password:</p>
      <p><a href="${resetLink}" style="display:inline-block;padding:8px 16px;border-radius:4px;background:#2563eb;color:#ffffff;text-decoration:none;">Reset password</a></p>
      <p>If you did not request this, you can safely ignore this email.</p>
      <p>If the button does not work, copy and paste this link into your browser:</p>
      <p><a href="${resetLink}">${resetLink}</a></p>
    `,
  }).catch(err => {
    console.error('Failed to send password reset email', err)
  })

  res.json({ success: true, data: { resetLink: process.env.NODE_ENV !== 'production' ? resetLink : '' } })

  // Audit: password reset requested (do not log token)
  await createAuditLog({
    userId: user.id,
    action: 'auth.request_password_reset',
    resourceId: user.id,
  })
})

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { token, password } = req.body
  if (!token || !password) {
    throw new BadRequestError('Token and password are required')
  }

  const passwordError = validatePasswordStrength(password)
  if (passwordError) {
    throw new BadRequestError(passwordError)
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

  // Audit: password reset completed
  await createAuditLog({
    userId: tokenRecord.userId,
    action: 'auth.reset_password',
    resourceId: tokenRecord.userId,
  })
})

export const login = asyncHandler(async (req: Request, res: Response) => {
  const body: Record<string, unknown> =
    typeof req.body === 'object' && req.body !== null ? (req.body as Record<string, unknown>) : {}
  const email = normalizeEmail(body.email)
  const password = typeof body.password === 'string' ? body.password : ''

  if (!email || password.length === 0) {
    throw new BadRequestError('Email and password are required')
  }

  const ip = getClientIp(req)
  const { failKey, blockKey } = lockoutKeys(ip, email)
  const redisOk = await ensureRedisConnected()
  if (redisOk && (await isBlocked(blockKey))) {
    throw new UnauthorizedError('Too many login attempts, please try again later')
  }

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
      },
      employee: true  // Include employee data
    }
  })

  if (!user || user.status !== 'active') {
    if (redisOk) {
      await recordLoginFailure(failKey, blockKey)
    }
    throw new UnauthorizedError('Invalid credentials or inactive account')
  }

  const isPasswordValid = await comparePassword(password, user.password)
  if (!isPasswordValid) {
    if (redisOk) {
      await recordLoginFailure(failKey, blockKey)
    }
    // Audit: failed login attempt
    await createAuditLog({
      userId: user.id,
      action: 'auth.login_failed',
      resourceId: user.id,
    })
    throw new UnauthorizedError('Invalid credentials')
  }

  if (redisOk) {
    await clearLoginFailures(failKey, blockKey)
  }

  const tokens = generateTokens(user.id, user.email, user.role.name)
  const { accessToken, refreshToken } = tokens

  if (redisOk) {
    await storeRefreshJti(user.id, tokens.refreshTokenJti)
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLogin: new Date() },
  })

  // Flatten permissions
  const permissions = user.role.permissions.map((rp: { permission: { resource: string; action: string } }) => `${rp.permission.resource}.${rp.permission.action}`)

  // Audit: successful login
  await createAuditLog({
    userId: user.id,
    action: 'auth.login',
    resourceId: user.id,
  })

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
        avatarUrl: user.avatarUrl,
        employee: user.employee  // Include employee data for profile form
      },
      permissions
    }
  })
})

export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.refreshAccessToken(req.body as any)
  res.json({
    success: true,
    data: result
  })
})

export const getProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new UnauthorizedError('User not authenticated')
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    include: {
      role: true,
      employee: true,
    }
  })

  if (!user || user.status !== 'active') {
    throw new UnauthorizedError('User not found or inactive')
  }

  const employee = user.employee

  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role.name,
        avatarUrl: user.avatarUrl,
        organizationId: user.organizationId,
        phoneNumber: employee?.phoneNumber ?? null,
        address: employee?.address ?? null,
        dateOfBirth: employee?.dateOfBirth ?? null,
        gender: employee?.gender ?? null,
        maritalStatus: employee?.maritalStatus ?? null,
        emergencyContact: employee?.emergencyContact ?? null,
        employee,
        status: user.status,
      },
      employee,
      permissions: req.user.permissions,
    },
  })
})

export const uploadAvatar = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new UnauthorizedError('User not authenticated')
  }

  const file = (req as any).file as any

  if (!file) {
    throw new BadRequestError('No file uploaded')
  }

  let avatarUrl: string

  if (file.path && typeof file.path === 'string' && /^https?:\/\//.test(file.path)) {
    avatarUrl = file.path
  } else {
    const baseUrl = process.env.FILE_BASE_URL || `${req.protocol}://${req.get('host')}`
    const filename =
      file.filename ||
      (typeof file.path === 'string' ? file.path.split(/[\\/]/).pop() : undefined)

    if (!filename) {
      throw new BadRequestError('Unable to determine uploaded file name')
    }

    avatarUrl = `${baseUrl}/uploads/${filename}`
  }

  await prisma.user.update({
    where: { id: req.user.id },
    data: { avatarUrl },
  })

  res.json({
    success: true,
    data: {
      avatarUrl,
    },
  })
})

export const changePassword = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { currentPassword, newPassword } = req.body

  if (!currentPassword || !newPassword) {
    throw new BadRequestError('Current password and new password are required')
  }

  const passwordError = validatePasswordStrength(newPassword)
  if (passwordError) {
    throw new BadRequestError(passwordError)
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

  // Audit: password changed
  await createAuditLog({
    userId: req.user!.id,
    action: 'auth.change_password',
    resourceId: req.user!.id,
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

  const normalizedEmergencyContact =
    emergencyContact &&
      (emergencyContact.name || emergencyContact.relationship || emergencyContact.phone)
      ? emergencyContact
      : null

  // Fetch current user to get existing details if not provided
  const currentUser = await prisma.user.findUnique({ where: { id: req.user!.id } })
  if (!currentUser) throw new UnauthorizedError('User not found')

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
  const finalFirstName = firstName || currentUser.firstName || ''
  const finalLastName = lastName || currentUser.lastName || ''

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
    emergencyContact: normalizedEmergencyContact
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
      emergencyContact: normalizedEmergencyContact
    }
  })

  res.json({
    success: true,
    data: {
      user: {
        id: currentUser.id,
        email: currentUser.email,
        firstName: finalFirstName,
        lastName: finalLastName,
        role: (currentUser as any).role?.name || (req as any).user?.role,
        avatarUrl: currentUser.avatarUrl,
        phoneNumber: employee.phoneNumber,
        address: employee.address,
        dateOfBirth: employee.dateOfBirth,
        gender: employee.gender,
        maritalStatus: employee.maritalStatus,
        emergencyContact: employee.emergencyContact,
        employee,
        status: currentUser.status,
      },
      employee
    }
  })
})