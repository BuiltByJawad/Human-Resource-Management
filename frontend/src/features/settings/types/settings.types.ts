export interface OrgSettings {
  siteName?: string | null
  tagline?: string | null
  companyName?: string | null
  companyAddress?: string | null
  logoUrl?: string | null
  faviconUrl?: string | null
}

export interface UpdateOrgSettingsPayload {
  siteName?: string
  tagline?: string
  companyName?: string
  companyAddress?: string
}

export interface ChangePasswordPayload {
  currentPassword: string
  newPassword: string
}
