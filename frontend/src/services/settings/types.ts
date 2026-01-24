export interface OrgSettingsPayload {
  siteName?: string | null
  tagline?: string | null
  companyName?: string | null
  companyAddress?: string | null
  logoUrl?: string | null
  faviconUrl?: string | null
  footerYear?: number | null
  privacyPolicyText?: string | null
  termsOfServiceText?: string | null
}

export interface OrgSettingsUpdateResponse {
  success?: boolean
  data?: OrgSettingsPayload
}

export interface OrgSettingsFormState {
  siteName: string
  tagline: string
  companyName: string
  companyAddress: string
  footerYear: string
  privacyPolicyText: string
  termsOfServiceText: string
}

export type OrgSettingsErrorFields = 'siteName' | 'companyName' | 'companyAddress'

export type OrgSettingsErrors = Partial<Record<OrgSettingsErrorFields, string>>

export interface NotificationPreferences {
  emailNotifs: boolean
  pushNotifs: boolean
}

export interface ChangePasswordPayload {
  currentPassword: string
  newPassword: string
}

export interface ChangePasswordFormValues extends ChangePasswordPayload {
  confirmPassword: string
}
