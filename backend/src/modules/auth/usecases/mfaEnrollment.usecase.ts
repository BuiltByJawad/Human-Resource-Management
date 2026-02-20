import { prisma } from '../../../shared/config/database'
import { generateMfaSecret, verifyMfaCode } from '../../../shared/utils/mfa'
import { BadRequestError, UnauthorizedError } from '../../../shared/utils/errors'
import type { StartMfaEnrollmentResponse } from '../dto'
import { authRepository } from '../auth.repository'
import { signMfaEnrollmentToken, verifyMfaEnrollmentToken } from '../auth.mfa'

export const startMfaEnrollmentUsecase = async (userId: string): Promise<StartMfaEnrollmentResponse> => {
  const user = await authRepository.findUserById(userId)
  if (!user) {
    throw new UnauthorizedError('User not found')
  }

  const issuer =
    (
      await prisma.companySettings.findFirst({
        orderBy: { updatedAt: 'desc' },
        select: { siteName: true },
      })
    )?.siteName || 'NovaHR'

  const { secret, otpauthUrl } = generateMfaSecret(user.email, issuer)

  await authRepository.updateUser(userId, {
    mfaSecret: secret,
    mfaEnabled: false,
  })

  const secretMasked = secret.length > 4 ? `${'*'.repeat(secret.length - 4)}${secret.slice(-4)}` : secret

  const enrollmentToken = signMfaEnrollmentToken({
    userId: user.id,
    email: user.email,
    type: 'mfa-enroll',
  })

  return {
    otpauthUrl,
    secretMasked,
    enrollmentToken,
  }
}

export const confirmMfaEnrollmentUsecase = async (userId: string, code: string, enrollmentToken: string): Promise<void> => {
  let payload: { userId: string; email: string; type: 'mfa-enroll' }
  try {
    payload = verifyMfaEnrollmentToken(enrollmentToken)
  } catch {
    throw new UnauthorizedError('Invalid or expired enrollment token')
  }

  if (!payload || payload.type !== 'mfa-enroll' || payload.userId !== userId) {
    throw new UnauthorizedError('Invalid enrollment token')
  }

  const user = await authRepository.findUserById(userId)
  if (!user || !user.mfaSecret) {
    throw new UnauthorizedError('MFA enrollment not started')
  }

  const isValid = verifyMfaCode(user.mfaSecret, code)
  if (!isValid) {
    throw new BadRequestError('Invalid MFA code')
  }

  await authRepository.updateUser(userId, {
    mfaEnabled: true,
  })
}

export const disableMfaUsecase = async (userId: string, code?: string): Promise<void> => {
  const user = await authRepository.findUserById(userId)
  if (!user) {
    throw new UnauthorizedError('User not found')
  }

  if (user.mfaEnabled && user.mfaSecret && code) {
    const isValid = verifyMfaCode(user.mfaSecret, code)
    if (!isValid) {
      throw new BadRequestError('Invalid MFA code')
    }
  }

  await authRepository.updateUser(userId, {
    mfaEnabled: false,
    mfaSecret: null,
  })
}
