import { authenticator } from 'otplib'

export interface MfaEnrollmentData {
  secret: string
  otpauthUrl: string
}

export function generateMfaSecret(label: string, issuer: string): MfaEnrollmentData {
  const secret = authenticator.generateSecret()
  const otpauthUrl = authenticator.keyuri(label, issuer, secret)

  return { secret, otpauthUrl }
}

export function verifyMfaCode(secret: string, token: string): boolean {
  if (!secret || !token) return false
  return authenticator.verify({ token, secret })
}
