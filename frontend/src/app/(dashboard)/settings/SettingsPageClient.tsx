"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { QRCodeCanvas } from "qrcode.react"

import { useAuthStore } from "@/store/useAuthStore"
import { useBrandingStore } from "@/store/useBrandingStore"
import { PERMISSIONS } from "@/constants/permissions"
import { useSettingsPage } from "@/hooks/useSettingsPage"
import type { BrandingSettingsPayload } from "@/services/settings/types"
import { NotificationsSection } from "@/components/features/settings/NotificationsSection"
import { SettingsActionCard } from "@/components/features/settings/SettingsActionCard"
import { BrandingSettingsSection } from "@/components/features/settings/BrandingSettingsSection"
import { SecuritySection } from "@/components/features/settings/SecuritySection"
import { PasswordChangeModal } from "@/components/features/settings/PasswordChangeModal"
import { PolicyHistorySection } from "@/components/features/settings/PolicyHistorySection"

interface SettingsPageClientProps {
  initialBrandingSettings: BrandingSettingsPayload
}

export function SettingsPageClient({ initialBrandingSettings }: SettingsPageClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showMfaBanner, setShowMfaBanner] = useState(false)
  const { hasPermission } = useAuthStore()
  const { logoUrl, faviconUrl } = useBrandingStore()
  const {
    brandingSettings,
    setBrandingSettings,
    brandingErrors,
    setBrandingErrors,
    isSavingSettings,
    isMounted,
    notifications,
    setNotifications,
    showPasswordModal,
    setShowPasswordModal,
    isChangingPassword,
    handleSaveNotifications,
    handleSaveBrandingSettings,
    handleLogoUpload,
    handleFaviconUpload,
    isMfaEnabled,
    isStartingMfa,
    isConfirmingMfa,
    isDisablingMfa,
    showMfaEnrollment,
    mfaOtpauthUrl,
    mfaSecretMasked,
    setShowMfaEnrollment,
    handleStartMfaEnrollment,
    handleConfirmMfaEnrollment,
    handleDisableMfa,
    onSubmit,
    register,
    handleSubmit,
    watch,
    reset,
    errors,
  } = useSettingsPage({ initialBrandingSettings })

  useEffect(() => {
    const mfaSetupRequired = searchParams.get('mfaSetupRequired')
    if (mfaSetupRequired === '1') {
      setShowMfaBanner(true)
    }
  }, [searchParams])

  const adminSections = useMemo(
    () => [
      {
        key: 'notifications',
        permission: PERMISSIONS.MANAGE_NOTIFICATIONS,
        title: "Notifications",
        description: "Manage how your workspace receives system notifications.",
        content: (
          <NotificationsSection
            title="Notifications"
            description="Manage how your workspace receives system notifications."
            notifications={notifications}
            onChange={setNotifications}
            onSave={handleSaveNotifications}
            emailInputId="email-notifs"
            pushInputId="push-notifs"
            saveLabel="Save preferences"
          />
        ),
      },
      {
        key: 'policy-history',
        permission: PERMISSIONS.MANAGE_SYSTEM_SETTINGS,
        title: "Policy Change History",
        description: "Review recent privacy policy and terms updates.",
        content: <PolicyHistorySection />,
      },
      {
        key: 'roles-permissions',
        permission: PERMISSIONS.MANAGE_ROLES,
        title: "Roles & Permissions",
        description: "Create roles, assign permissions, and control access across the workspace.",
        action: () => router.push("/roles"),
        actionLabel: "Manage roles",
      },
      {
        key: 'payroll-config',
        permission: PERMISSIONS.CONFIGURE_PAYROLL,
        title: "Payroll Configuration",
        description: "Define pay cycles, tax rules, and payroll policies.",
        action: () => router.push("/payroll"),
        actionLabel: "Go to payroll settings",
      },
      {
        key: 'compliance',
        permission: PERMISSIONS.MANAGE_COMPLIANCE,
        title: "Compliance & Policies",
        description: "Set up compliance rules and audit your HR policies.",
        action: () => router.push("/compliance"),
        actionLabel: "Manage compliance",
      },
      {
        key: 'branding',
        permission: PERMISSIONS.MANAGE_SYSTEM_SETTINGS,
        title: "Branding",
        description: "Configure the name, logo, and public identity of your HR workspace.",
        content: (
          <BrandingSettingsSection
            logoUrl={logoUrl}
            faviconUrl={faviconUrl}
            brandingSettings={brandingSettings}
            brandingErrors={brandingErrors}
            onUpdateBrandingSettings={setBrandingSettings}
            onUpdateBrandingErrors={setBrandingErrors}
            onSave={handleSaveBrandingSettings}
            isSaving={isSavingSettings}
            onLogoUpload={handleLogoUpload}
            onFaviconUpload={handleFaviconUpload}
          />
        ),
      },
    ],
    [
      notifications,
      handleSaveNotifications,
      brandingSettings,
      isSavingSettings,
      logoUrl,
      faviconUrl,
      router,
      handleFaviconUpload,
      handleLogoUpload,
      handleSaveBrandingSettings,
    ],
  )

  if (!isMounted) {
    return (
      <div className="p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="h-8 w-40 bg-slate-200 rounded animate-pulse mb-6" />
          <div className="space-y-4">
            <div className="h-32 bg-slate-100 rounded animate-pulse" />
            <div className="h-32 bg-slate-100 rounded animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>

        {showMfaBanner && (
          <div className="mb-6 flex items-start justify-between gap-4 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <div>
              <p className="font-medium">Two-factor authentication required</p>
              <p className="mt-1 text-amber-800">
                Use the Security section below to enable two-factor authentication for your account.
              </p>
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById('security-section')
                  if (el) {
                    const rect = el.getBoundingClientRect()
                    const offset = 80
                    const targetY = rect.top + window.scrollY - offset
                    window.scrollTo({ top: Math.max(0, targetY), behavior: 'smooth' })
                  }
                }}
                className="mt-3 inline-flex items-center rounded-md border border-amber-300 bg-white px-3 py-1.5 text-xs font-medium text-amber-900 shadow-sm hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-1"
              >
                Set up now
              </button>
            </div>
            <button
              type="button"
              onClick={() => setShowMfaBanner(false)}
              aria-label="Dismiss MFA setup notice"
              className="ml-4 inline-flex h-6 w-6 items-center justify-center rounded-full border border-amber-300 text-xs text-amber-800 hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-1"
            >
              ×
            </button>
          </div>
        )}

        <div className="space-y-6">
          {hasPermission(PERMISSIONS.MANAGE_LEAVE_POLICIES) ? (
            <SettingsActionCard
              title="Leave Policy"
              description="Configure leave entitlements and holiday calendar."
              actionLabel="Manage"
              onAction={() => router.push('/settings/leave-policy')}
              variant="outline"
            />
          ) : null}

          {adminSections
            .filter((section) => hasPermission(section.permission))
            .map((section) => (
              <div key={section.key} className="bg-white shadow rounded-lg p-6 border border-gray-100">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">{section.title}</h2>
                    <p className="mt-1 text-sm text-gray-500">{section.description}</p>
                  </div>
                  {section.action && section.actionLabel && (
                    <button
                      onClick={section.action}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      {section.actionLabel}
                    </button>
                  )}
                </div>
                {section.content && <div className="mt-4">{section.content}</div>}
              </div>
            ))}

          <SecuritySection
            id="security-section"
            onChangePassword={() => {
              setShowPasswordModal(true)
              reset()
            }}
            mfaStatus={
              isMfaEnabled ? (
                <span className="inline-flex items-center gap-2 text-emerald-700">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Two-factor authentication is enabled.
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 text-amber-700">
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  Two-factor authentication is not enabled.
                </span>
              )
            }
            mfaControls={
              isMfaEnabled ? (
                <button
                  type="button"
                  onClick={handleDisableMfa}
                  disabled={isDisablingMfa}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {isDisablingMfa ? 'Disabling…' : 'Disable two-factor authentication'}
                </button>
              ) : (
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={handleStartMfaEnrollment}
                    disabled={isStartingMfa}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {isStartingMfa ? 'Preparing…' : 'Enable two-factor authentication'}
                  </button>

                  {showMfaEnrollment && (
                    <div className="mt-3 rounded-md border border-dashed border-slate-300 bg-slate-50 p-4">
                      <p className="text-sm text-slate-700">
                        Scan the QR code with your authenticator app (Google Authenticator, 1Password, etc.), then
                        enter the 6-digit code to confirm.
                      </p>
                      {mfaOtpauthUrl && (
                        <div className="mt-4 flex justify-center">
                          <div className="rounded-xl bg-white p-3 shadow-sm border border-slate-200">
                            <QRCodeCanvas value={mfaOtpauthUrl} size={176} includeMargin />
                          </div>
                        </div>
                      )}
                      {mfaOtpauthUrl && (
                        <div className="mt-3 text-xs break-all font-mono text-slate-600">
                          {mfaOtpauthUrl}
                        </div>
                      )}
                      {mfaSecretMasked && (
                        <p className="mt-2 text-xs text-slate-500">Secret: {mfaSecretMasked}</p>
                      )}
                      <form
                        className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center"
                        onSubmit={(event) => {
                          event.preventDefault()
                          const formData = new FormData(event.currentTarget)
                          const code = String(formData.get('mfa-code') ?? '').trim()
                          if (!code) return
                          void handleConfirmMfaEnrollment(code)
                        }}
                      >
                        <input
                          type="text"
                          name="mfa-code"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          placeholder="123456"
                          className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                        />
                        <div className="flex gap-2 mt-2 sm:mt-0 sm:ml-2">
                          <button
                            type="submit"
                            disabled={isConfirmingMfa}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 disabled:opacity-50"
                          >
                            {isConfirmingMfa ? 'Verifying…' : 'Confirm code'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowMfaEnrollment(false)}
                            className="inline-flex items-center px-3 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-300"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                </div>
              )
            }
          />

          {hasPermission(PERMISSIONS.UPDATE_OWN_NOTIFICATIONS) && (
            <NotificationsSection
              title="My notifications"
              description="Choose how you want to be notified about HR updates."
              notifications={notifications}
              onChange={setNotifications}
              onSave={handleSaveNotifications}
              emailInputId="personal-email-notifs"
              pushInputId="personal-push-notifs"
              saveLabel="Save my preferences"
            />
          )}
        </div>
        <PasswordChangeModal
          isOpen={showPasswordModal}
          onClose={() => {
            setShowPasswordModal(false)
            reset()
          }}
          onSubmit={handleSubmit(onSubmit)}
          register={register}
          errors={errors}
          isChangingPassword={isChangingPassword}
          newPasswordValue={watch('newPassword', '')}
        />
      </div>
    </div>
  )
}
