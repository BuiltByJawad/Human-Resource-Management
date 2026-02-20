import { authRepository } from '../auth.repository'

export const uploadAvatarUsecase = async (userId: string, avatarUrl: string): Promise<{ avatarUrl: string }> => {
  await authRepository.updateUser(userId, {
    avatarUrl,
  })

  return { avatarUrl }
}
