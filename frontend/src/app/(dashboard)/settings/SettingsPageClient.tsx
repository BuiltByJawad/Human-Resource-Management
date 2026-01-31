"use client"

import { useMemo } from "react"
import { useRouter } from "next/navigation"

import { useAuthStore } from "@/store/useAuthStore"
import { useBrandingStore } from "@/store/useBrandingStore"
import { PERMISSIONS } from "@/constants/permissions"
import DashboardShell from "@/components/ui/DashboardShell"
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
    onSubmit,
    register,
    handleSubmit,
    reset,
    errors,
  } = useSettingsPage({ initialBrandingSettings })

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
      <div className="min-h-screen bg-gray-50/50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
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
    <DashboardShell>
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-8">Settings</h1>

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

            {hasPermission(PERMISSIONS.CHANGE_OWN_PASSWORD) && (
              <SecuritySection
                onChangePassword={() => {
                  setShowPasswordModal(true)
                  reset()
                }}
              />
            )}

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
          />
        </div>
      </div>
    </DashboardShell>
  )
}
