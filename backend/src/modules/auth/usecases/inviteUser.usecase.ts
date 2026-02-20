import { addHours } from 'date-fns'
import { prisma } from '../../../shared/config/database'
import { hashPassword } from '../../../shared/utils/auth'
import { sendEmail } from '../../../shared/utils/email'
import { createAuditLog } from '../../../shared/utils/audit'
import { BadRequestError, NotFoundError } from '../../../shared/utils/errors'
import type { InviteUserDto } from '../dto'
import { authRepository } from '../auth.repository'
import { generateToken, hashToken } from '../auth.tokens'

export const inviteUserUsecase = async (
  data: InviteUserDto,
  invitedBy: string
): Promise<{ inviteId: string; inviteLink: string }> => {
  const { email, roleId, expiresInHours = 72 } = data

  const role = await authRepository.findRoleById(roleId)
  if (!role) {
    throw new NotFoundError('Role not found')
  }

  const employeeForEmail = await authRepository.findEmployeeByEmail(email)

  let user = await authRepository.findUserByEmail(email)

  if (user && user.verified) {
    throw new BadRequestError('User is already active and verified')
  }

  if (!user) {
    const randomPassword = generateToken(16)
    const hashedRandomPassword = await hashPassword(randomPassword)

    user = (await authRepository.createUser({
      email,
      password: hashedRandomPassword,
      role: { connect: { id: roleId } },
      status: 'active',
      verified: false,
      firstName: employeeForEmail?.firstName ?? null,
      lastName: employeeForEmail?.lastName ?? null,
    })) as any
  } else {
    const updateData: Record<string, unknown> = {}

    if ((user as any).roleId !== roleId) {
      updateData.roleId = roleId
    }

    if ((!user.firstName && employeeForEmail?.firstName) || (!user.lastName && employeeForEmail?.lastName)) {
      updateData.firstName = user.firstName ?? employeeForEmail?.firstName ?? null
      updateData.lastName = user.lastName ?? employeeForEmail?.lastName ?? null
    }

    if (Object.keys(updateData).length > 0) {
      user = (await authRepository.updateUser(user.id, updateData as any)) as any
    }
  }

  await authRepository.deleteInvitesByEmail(email)

  if (!user) {
    throw new Error('User creation failed')
  }

  const token = generateToken()
  const tokenHash = hashToken(token)

  const invite = await authRepository.createInvite({
    email,
    role: { connect: { id: roleId } },
    user: { connect: { id: user.id } },
    tokenHash,
    expiresAt: addHours(new Date(), expiresInHours),
  })

  if (employeeForEmail) {
    await authRepository.updateEmployeeUserId(email, user.id)
  }

  const inviteLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/accept-invite?token=${token}`

  const settings = await prisma.companySettings.findFirst({
    orderBy: { updatedAt: 'desc' },
    select: { siteName: true },
  })
  const siteName = settings?.siteName || 'NovaHR'

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
  }).catch((err) => {
    console.error('Failed to send invite email', err)
  })

  await createAuditLog({
    userId: invitedBy,
    action: 'auth.invite_user',
    resourceId: user.id,
    newValues: { email, roleId },
  })

  return {
    inviteId: invite.id,
    inviteLink,
  }
}
