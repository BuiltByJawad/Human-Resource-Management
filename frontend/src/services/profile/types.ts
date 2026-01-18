export interface EmergencyContactPayload {
  name?: string
  relationship?: string
  phone?: string
}

export interface UpdateProfilePayload {
  firstName: string
  lastName: string
  phoneNumber: string
  address: string
  dateOfBirth: string
  gender: string
  maritalStatus: string
  emergencyContact: EmergencyContactPayload
}

export interface ProfileFormValues {
  firstName: string
  lastName: string
  phoneNumber: string
  address: string
  dateOfBirth: string
  gender: string
  maritalStatus: string
  emergencyContactName: string
  emergencyContactRelation: string
  emergencyContactPhone: string
}

export interface ProfileUpdateResponse {
  user?: Record<string, unknown>
  employee?: Record<string, unknown>
}
