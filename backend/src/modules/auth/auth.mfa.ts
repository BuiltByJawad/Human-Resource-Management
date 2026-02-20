import jwt from 'jsonwebtoken'
import { logger } from '../../shared/config/database'

export interface MfaJwtPayload {
  userId: string
  email: string
  type: 'mfa'
}

export interface MfaEnrollmentJwtPayload {
  userId: string
  email: string
  type: 'mfa-enroll'
}

export const getMfaJwtSecret = (): string => {
  const mfaJwtSecret = process.env.JWT_MFA_SECRET || process.env.JWT_SECRET
  if (!mfaJwtSecret) {
    logger.error('JWT_MFA_SECRET or JWT_SECRET must be configured for MFA')
    throw new Error('MFA configuration error')
  }
  return mfaJwtSecret
}

export const signMfaToken = (payload: MfaJwtPayload): string => {
  return jwt.sign(payload, getMfaJwtSecret(), { expiresIn: '5m' })
}

export const verifyMfaToken = (mfaToken: string): MfaJwtPayload => {
  return jwt.verify(mfaToken, getMfaJwtSecret()) as MfaJwtPayload
}

export const signMfaEnrollmentToken = (payload: MfaEnrollmentJwtPayload): string => {
  return jwt.sign(payload, getMfaJwtSecret(), { expiresIn: '10m' })
}

export const verifyMfaEnrollmentToken = (token: string): MfaEnrollmentJwtPayload => {
  return jwt.verify(token, getMfaJwtSecret()) as MfaEnrollmentJwtPayload
}
