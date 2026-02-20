import { authRepository } from '../auth.repository'
import { UnauthorizedError } from '../../../shared/utils/errors'

export const updateProfileUsecase = async (
  userId: string,
  email: string,
  data: {
    firstName?: string
    lastName?: string
    phoneNumber?: string
    address?: string
    dateOfBirth?: Date
    gender?: string
    maritalStatus?: string
    emergencyContact?: { name?: string; relationship?: string; phone?: string } | null
  }
): Promise<{ user: { firstName: string; lastName: string }; employee: unknown }> => {
  const { firstName, lastName } = data

  if (firstName || lastName) {
    await authRepository.updateUser(userId, {
      firstName: firstName || undefined,
      lastName: lastName || undefined,
    })
  }

  const currentUser = await authRepository.findUserById(userId)
  if (!currentUser) {
    throw new UnauthorizedError('User not found')
  }

  const finalFirstName = firstName || currentUser.firstName || ''
  const finalLastName = lastName || currentUser.lastName || ''

  const normalizedEmergencyContact =
    data.emergencyContact && (data.emergencyContact.name || data.emergencyContact.relationship || data.emergencyContact.phone)
      ? data.emergencyContact
      : null

  const employee = await authRepository.upsertEmployee(userId, {
    userId,
    email,
    firstName: finalFirstName,
    lastName: finalLastName,
    employeeNumber: `EMP-${Date.now()}`,
    hireDate: new Date(),
    salary: 0,
    phoneNumber: data.phoneNumber,
    address: data.address,
    dateOfBirth: data.dateOfBirth,
    gender: data.gender,
    maritalStatus: data.maritalStatus,
    emergencyContact: normalizedEmergencyContact,
  })

  return {
    user: {
      firstName: finalFirstName,
      lastName: finalLastName,
    },
    employee,
  }
}
