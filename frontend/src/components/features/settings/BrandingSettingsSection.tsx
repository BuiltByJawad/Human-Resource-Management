import AvatarUpload from '@/components/ui/AvatarUpload'
import { Input, TextArea } from '@/components/ui/FormComponents'
import type {
  OrgSettingsErrors,
  OrgSettingsFormState,
} from '@/services/settings/types'

interface BrandingSettingsSectionProps {
  logoUrl: string | null
  faviconUrl: string | null
  orgSettings: OrgSettingsFormState
  orgErrors: OrgSettingsErrors
  onUpdateOrgSettings: (next: OrgSettingsFormState) => void
  onUpdateOrgErrors: (updater: (prev: OrgSettingsErrors) => OrgSettingsErrors) => void
  onSave: () => void
  isSaving: boolean
  onLogoUpload: (file: File) => void
  onFaviconUpload: (file: File) => void
}

export const BrandingSettingsSection = ({
  logoUrl,
  faviconUrl,
  orgSettings,
  orgErrors,
  onUpdateOrgSettings,
  onUpdateOrgErrors,
  onSave,
  isSaving,
  onLogoUpload,
  onFaviconUpload,
}: BrandingSettingsSectionProps) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-3">
        <p className="text-sm font-medium text-gray-900">Logo</p>
        <p className="text-xs text-gray-500">Upload your company logo. This appears in the sidebar and mobile menu.</p>
        <AvatarUpload currentAvatarUrl={logoUrl || undefined} onUpload={onLogoUpload} className="flex-col !items-start" />
      </div>
      <div className="space-y-3">
        <p className="text-sm font-medium text-gray-900">Favicon</p>
        <p className="text-xs text-gray-500">Upload a small square icon shown in the browser tab.</p>
        <AvatarUpload currentAvatarUrl={faviconUrl || undefined} onUpload={onFaviconUpload} className="flex-col !items-start" />
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Input
        label="Site Name"
        required
        error={orgErrors.siteName}
        value={orgSettings.siteName}
        onChange={(e) => {
          if (orgErrors.siteName) {
            onUpdateOrgErrors((prev) => ({ ...prev, siteName: undefined }))
          }
          onUpdateOrgSettings({ ...orgSettings, siteName: e.target.value })
        }}
      />
      <Input
        label="Tagline"
        value={orgSettings.tagline}
        onChange={(e) => onUpdateOrgSettings({ ...orgSettings, tagline: e.target.value })}
      />
      <Input
        label="Footer Year"
        placeholder="2026"
        value={orgSettings.footerYear}
        onChange={(e) => {
          onUpdateOrgSettings({ ...orgSettings, footerYear: e.target.value })
        }}
      />
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <TextArea
        label="Privacy Policy"
        rows={6}
        value={orgSettings.privacyPolicyText}
        onChange={(e) => onUpdateOrgSettings({ ...orgSettings, privacyPolicyText: e.target.value })}
      />
      <TextArea
        label="Terms of Service"
        rows={6}
        value={orgSettings.termsOfServiceText}
        onChange={(e) => onUpdateOrgSettings({ ...orgSettings, termsOfServiceText: e.target.value })}
      />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Input
        label="Company Name (for payslips)"
        required
        error={orgErrors.companyName}
        value={orgSettings.companyName}
        onChange={(e) => {
          if (orgErrors.companyName) {
            onUpdateOrgErrors((prev) => ({ ...prev, companyName: undefined }))
          }
          onUpdateOrgSettings({ ...orgSettings, companyName: e.target.value })
        }}
      />
      <Input
        label="Company Address (for payslips)"
        required
        error={orgErrors.companyAddress}
        value={orgSettings.companyAddress}
        onChange={(e) => {
          if (orgErrors.companyAddress) {
            onUpdateOrgErrors((prev) => ({ ...prev, companyAddress: undefined }))
          }
          onUpdateOrgSettings({ ...orgSettings, companyAddress: e.target.value })
        }}
      />
    </div>
    <div className="flex justify-end">
      <button
        onClick={onSave}
        disabled={isSaving}
        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
      >
        {isSaving ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  </div>
)
