'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'

import { useToast } from '@/components/ui/ToastProvider'
import { useOrgStore } from '@/store/useOrgStore'
import {
  changePassword,
  updateOrgSettings,
  uploadOrgFavicon,
  uploadOrgLogo,
} from '@/services/settings/api'
import type {
  ChangePasswordPayload,
  NotificationPreferences,
  OrgSettingsFormState,
  OrgSettingsPayload,
} from '@/services/settings/types'

type PasswordFormData = ChangePasswordPayload & {
  confirmPassword: string
}

const passwordSchema = yup.object({
  currentPassword: yup.string().required('Current password is required'),
  newPassword: yup
    .string()
    .required('New password is required')
    .min(8, 'Password must be at least 8 characters long')
    .test(
      'complexity',
      'Password must include at least three of the following: uppercase letter, lowercase letter, number, special character',
      (value) => {
        if (!value) return false
        const hasUpper = /[A-Z]/.test(value)
        const hasLower = /[a-z]/.test(value)
        const hasNumber = /\d/.test(value)
        const hasSymbol = /[^A-Za-z0-9]/.test(value)
        const categories = [hasUpper, hasLower, hasNumber, hasSymbol].filter(Boolean).length
        return categories >= 3
      },
    ),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('newPassword')], 'Passwords must match')
    .required('Confirm password is required'),
})

const DEFAULT_ORG_SETTINGS: OrgSettingsFormState = {
  siteName: '',
  tagline: '',
  companyName: '',
  companyAddress: '',
  footerYear: '',
  privacyPolicyText: '',
  termsOfServiceText: '',
}

const DEFAULT_NOTIFICATIONS: NotificationPreferences = {
  emailNotifs: true,
  pushNotifs: false,
}

interface UseSettingsPageOptions {
  initialOrgSettings: OrgSettingsPayload
}

export const useSettingsPage = ({ initialOrgSettings }: UseSettingsPageOptions) => {
  const { showToast } = useToast()
  const { updateOrg, logoUrl, faviconUrl, setLoaded } = useOrgStore()

  const normalizedInitialOrg = useMemo(
    () => ({
      siteName: initialOrgSettings.siteName ?? '',
      tagline: initialOrgSettings.tagline ?? '',
      companyName: initialOrgSettings.companyName ?? '',
      companyAddress: initialOrgSettings.companyAddress ?? '',
      footerYear: initialOrgSettings.footerYear ? String(initialOrgSettings.footerYear) : '',
      privacyPolicyText: initialOrgSettings.privacyPolicyText ?? '',
      termsOfServiceText: initialOrgSettings.termsOfServiceText ?? '',
      logoUrl: initialOrgSettings.logoUrl ?? null,
      faviconUrl: initialOrgSettings.faviconUrl ?? null,
    }),
    [initialOrgSettings],
  )

  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [notifications, setNotifications] = useState(DEFAULT_NOTIFICATIONS)
  const [orgSettings, setOrgSettings] = useState<OrgSettingsFormState>(() => ({
    ...DEFAULT_ORG_SETTINGS,
    siteName: normalizedInitialOrg.siteName,
    tagline: normalizedInitialOrg.tagline,
    companyName: normalizedInitialOrg.companyName,
    companyAddress: normalizedInitialOrg.companyAddress,
  }))
  const [orgErrors, setOrgErrors] = useState<
    Partial<Record<'siteName' | 'companyName' | 'companyAddress', string>>
  >({})
  const [isSavingSettings, setIsSavingSettings] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PasswordFormData>({
    resolver: yupResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  })

  useEffect(() => {
    setOrgSettings({
      siteName: normalizedInitialOrg.siteName,
      tagline: normalizedInitialOrg.tagline,
      companyName: normalizedInitialOrg.companyName,
      companyAddress: normalizedInitialOrg.companyAddress,
      footerYear: normalizedInitialOrg.footerYear,
      privacyPolicyText: normalizedInitialOrg.privacyPolicyText,
      termsOfServiceText: normalizedInitialOrg.termsOfServiceText,
    })
    updateOrg({
      siteName: normalizedInitialOrg.siteName,
      tagline: normalizedInitialOrg.tagline,
      companyName: normalizedInitialOrg.companyName,
      companyAddress: normalizedInitialOrg.companyAddress,
      footerYear: normalizedInitialOrg.footerYear ? Number(normalizedInitialOrg.footerYear) : null,
      logoUrl: normalizedInitialOrg.logoUrl,
      faviconUrl: normalizedInitialOrg.faviconUrl,
    })
    setLoaded(true)
  }, [normalizedInitialOrg, updateOrg, setLoaded])

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const handleSaveNotifications = useCallback(() => {
    showToast('Notification preferences saved', 'success')
  }, [showToast])

  const handleSaveOrgSettings = useCallback(async () => {
    const errorsMap: Partial<Record<'siteName' | 'companyName' | 'companyAddress', string>> = {}
    if (!orgSettings.siteName.trim()) errorsMap.siteName = 'Site name is required'
    if (!orgSettings.companyName.trim()) errorsMap.companyName = 'Company name is required'
    if (!orgSettings.companyAddress.trim()) errorsMap.companyAddress = 'Company address is required'

    if (Object.keys(errorsMap).length > 0) {
      setOrgErrors(errorsMap)
      const firstError = Object.values(errorsMap).find(Boolean)
      if (firstError) showToast(firstError, 'error')
      return
    }

    setIsSavingSettings(true)
    try {
      const payload: OrgSettingsPayload = {
        siteName: orgSettings.siteName,
        tagline: orgSettings.tagline,
        companyName: orgSettings.companyName,
        companyAddress: orgSettings.companyAddress,
        footerYear: orgSettings.footerYear ? Number(orgSettings.footerYear) : null,
        privacyPolicyText: orgSettings.privacyPolicyText,
        termsOfServiceText: orgSettings.termsOfServiceText,
      }
      const data = await updateOrgSettings(payload)
      updateOrg({
        siteName: data.siteName ?? orgSettings.siteName,
        tagline: data.tagline ?? orgSettings.tagline,
        companyName: data.companyName ?? orgSettings.companyName,
        companyAddress: data.companyAddress ?? orgSettings.companyAddress,
        footerYear: data.footerYear ?? (orgSettings.footerYear ? Number(orgSettings.footerYear) : null),
      })
      showToast('Organization settings saved', 'success')
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to save settings'
      showToast(message, 'error')
    } finally {
      setIsSavingSettings(false)
    }
  }, [orgSettings, showToast, updateOrg])

  const handleLogoUpload = useCallback(
    async (file: File) => {
      try {
        const url = await uploadOrgLogo(file)
        if (url) {
          updateOrg({ logoUrl: url })
          showToast('Logo updated', 'success')
        } else {
          showToast('Logo uploaded but no URL returned from server', 'error')
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to upload logo'
        showToast(message, 'error')
      }
    },
    [showToast, updateOrg],
  )

  const handleFaviconUpload = useCallback(
    async (file: File) => {
      try {
        const url = await uploadOrgFavicon(file)
        if (url) {
          updateOrg({ faviconUrl: url })
          showToast('Favicon updated', 'success')
        } else {
          showToast('Favicon uploaded but no URL returned from server', 'error')
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to upload favicon'
        showToast(message, 'error')
      }
    },
    [showToast, updateOrg],
  )

  const onSubmit = useCallback(
    async (data: PasswordFormData) => {
      setIsChangingPassword(true)
      try {
        await changePassword({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        })
        showToast('Password changed successfully', 'success')
        setShowPasswordModal(false)
        reset()
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to change password'
        showToast(message, 'error')
      } finally {
        setIsChangingPassword(false)
      }
    },
    [reset, showToast],
  )

  return {
    logoUrl,
    faviconUrl,
    orgSettings,
    setOrgSettings,
    orgErrors,
    setOrgErrors,
    isSavingSettings,
    isMounted,
    notifications,
    setNotifications,
    showPasswordModal,
    setShowPasswordModal,
    isChangingPassword,
    handleSaveNotifications,
    handleSaveOrgSettings,
    handleLogoUpload,
    handleFaviconUpload,
    onSubmit,
    register,
    handleSubmit,
    reset,
    errors,
  }
}
