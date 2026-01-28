export interface BrandingSettingsPayload {
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

export interface BrandingSettingsUpdateResponse {
  success?: boolean
  data?: BrandingSettingsPayload
}

export interface BrandingSettingsFormState {
  siteName: string
  tagline: string
  companyName: string
  companyAddress: string
  footerYear: string
  privacyPolicyText: string
  termsOfServiceText: string
}

export type BrandingSettingsErrorFields = 'siteName' | 'companyName' | 'companyAddress'

export type BrandingSettingsErrors = Partial<Record<BrandingSettingsErrorFields, string>>

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

export interface PolicyHistoryUser {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  role?: { name?: string | null } | null
}

export interface PolicyHistoryEntry {
  id: string
  action: string
  createdAt: string
  user: PolicyHistoryUser
  oldValues?: Record<string, unknown> | null
  newValues?: Record<string, unknown> | null
}
