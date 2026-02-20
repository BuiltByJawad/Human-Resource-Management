import { addHours } from 'date-fns'
import { prisma } from '../../../shared/config/database'
import { hashPassword, validatePasswordStrength } from '../../../shared/utils/auth'
import { sendEmail } from '../../../shared/utils/email'
import { createAuditLog } from '../../../shared/utils/audit'
import { BadRequestError } from '../../../shared/utils/errors'
import type { PasswordResetDto, PasswordResetRequestDto } from '../dto'
import { authRepository } from '../auth.repository'
import { generateToken, hashToken } from '../auth.tokens'

export const requestPasswordResetUsecase = async (
  data: PasswordResetRequestDto
): Promise<{ resetLink: string }> => {
  const { email } = data

  const user = await authRepository.findUserByEmail(email)
  if (!user) {
    return { resetLink: '' }
  }

  if (!user.verified) {
    throw new BadRequestError('Account is not verified. Please activate your account first.')
  }

  const token = generateToken()
  const tokenHash = hashToken(token)

  await authRepository.createPasswordResetToken({
    user: { connect: { id: user.id } },
    tokenHash,
    expiresAt: addHours(new Date(), 2),
  })

  const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/reset-password?token=${token}`

  const settings = await prisma.companySettings.findFirst({
    select: { siteName: true },
  })
  const siteName = settings?.siteName || 'NovaHR'

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
  }).catch((err) => {
    console.error('Failed to send password reset email', err)
  })

  await createAuditLog({
    userId: user.id,
    action: 'auth.request_password_reset',
    resourceId: user.id,
  })

  return { resetLink: process.env.NODE_ENV !== 'production' ? resetLink : '' }
}

export const resetPasswordUsecase = async (data: PasswordResetDto): Promise<void> => {
  const { token, password } = data

  const passwordError = validatePasswordStrength(password)
  if (passwordError) {
    throw new BadRequestError(passwordError)
  }

  const tokenRecord = await authRepository.findPasswordResetToken(hashToken(token))
  if (!tokenRecord) {
    throw new BadRequestError('Reset token is invalid or expired')
  }

  const hashedPassword = await hashPassword(password)

  await authRepository.updateUserPassword(tokenRecord.userId, hashedPassword)
  await authRepository.markTokenAsUsed(tokenRecord.id)

  await createAuditLog({
    userId: tokenRecord.userId,
    action: 'auth.reset_password',
    resourceId: tokenRecord.userId,
  })
}
