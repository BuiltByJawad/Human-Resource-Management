import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import config from '../config/config'

export const PASSWORD_MIN_LENGTH = 8

export interface GeneratedTokens {
  accessToken: string
  refreshToken: string
  refreshTokenJti: string
}

export const validatePasswordStrength = (password: string): string | null => {
  if (!password || password.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters long`
  }

  const hasUpper = /[A-Z]/.test(password)
  const hasLower = /[a-z]/.test(password)
  const hasNumber = /\d/.test(password)
  const hasSymbol = /[^A-Za-z0-9]/.test(password)

  const categories = [hasUpper, hasLower, hasNumber, hasSymbol].filter(Boolean).length

  if (categories < 3) {
    return 'Password must include at least three of the following: uppercase letter, lowercase letter, number, special character'
  }

  return null
}

export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12
  return bcrypt.hash(password, saltRounds)
}

export const comparePassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword)
}

export const generateTokens = (userId: string, email: string, role: string): GeneratedTokens => {
  const accessExpirationMinutes =
    typeof config.jwt.accessExpirationMinutes === 'number' && Number.isFinite(config.jwt.accessExpirationMinutes)
      ? config.jwt.accessExpirationMinutes
      : 15
  const refreshExpirationDays =
    typeof config.jwt.refreshExpirationDays === 'number' && Number.isFinite(config.jwt.refreshExpirationDays)
      ? config.jwt.refreshExpirationDays
      : 7

  const refreshTokenJti = typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex')

  const accessToken = jwt.sign(
    { userId, email, role },
    process.env.JWT_SECRET!,
    { expiresIn: `${accessExpirationMinutes}m` }
  )
  
  const refreshToken = jwt.sign(
    { userId, jti: refreshTokenJti },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: `${refreshExpirationDays}d` }
  )
  
  return { accessToken, refreshToken, refreshTokenJti }
}

export const verifyToken = (token: string, secret: string) => {
  return jwt.verify(token, secret)
}

export const generateEmployeeNumber = (): string => {
  const prefix = 'EMP'
  const timestamp = Date.now().toString().slice(-6)
  const random = Math.random().toString(36).substr(2, 4).toUpperCase()
  return `${prefix}${timestamp}${random}`
}

export const generateResetToken = (): string => {
  return crypto.randomBytes(32).toString('hex')
}

export const maskEmail = (email: string): string => {
  const [username, domain] = email.split('@')
  const maskedUsername = username.slice(0, 2) + '*'.repeat(username.length - 2)
  return `${maskedUsername}@${domain}`
}

export const sanitizeInput = (input: string): string => {
  return input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
}