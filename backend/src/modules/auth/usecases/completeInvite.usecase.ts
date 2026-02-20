import { hashPassword, validatePasswordStrength } from '../../../shared/utils/auth'
import { createAuditLog } from '../../../shared/utils/audit'
import { BadRequestError } from '../../../shared/utils/errors'
import type { CompleteInviteDto } from '../dto'
import { authRepository } from '../auth.repository'
import { hashToken } from '../auth.tokens'

export const completeInviteUsecase = async (data: CompleteInviteDto): Promise<{ userId: string; email: string }> => {
  const { token, password } = data

  const passwordError = validatePasswordStrength(password)
  if (passwordError) {
    throw new BadRequestError(passwordError)
  }

  const invite = await authRepository.findInvite(hashToken(token))
  if (!invite) {
    throw new BadRequestError('Invite is invalid or expired')
  }

  const hashedPassword = await hashPassword(password)

  let user = invite.user
  if (user) {
    user = await authRepository.updateUser(user.id, {
      password: hashedPassword,
      role: { connect: { id: invite.roleId } },
      status: 'active',
      verified: true,
    })
  } else {
    const defaultRole = await authRepository.findRoleById(invite.roleId)
    user = await authRepository.createUser({
      email: invite.email,
      password: hashedPassword,
      role: { connect: { id: invite.roleId } },
      status: 'active',
      verified: true,
    })
  }

  await authRepository.acceptInvite(invite.id, user.id)

  await createAuditLog({
    userId: user.id,
    action: 'auth.complete_invite',
    resourceId: user.id,
  })

  return {
    userId: user.id,
    email: user.email,
  }
}
