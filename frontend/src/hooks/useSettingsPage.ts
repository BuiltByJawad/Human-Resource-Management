'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'

import { useToast } from '@/components/ui/ToastProvider'
import { useBrandingStore } from '@/store/useBrandingStore'
import {
  changePassword,
  updateBrandingSettings,
  uploadBrandingFavicon,
  uploadBrandingLogo,
} from '@/services/settings/api'
import type {
  ChangePasswordPayload,
  NotificationPreferences,
  BrandingSettingsFormState,
  BrandingSettingsPayload,
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

const DEFAULT_BRANDING_SETTINGS: BrandingSettingsFormState = {
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
  initialBrandingSettings: BrandingSettingsPayload
}

export const useSettingsPage = ({ initialBrandingSettings }: UseSettingsPageOptions) => {
  const { showToast } = useToast()
  const { updateBranding, setLoaded } = useBrandingStore()

  const normalizedInitialBranding = useMemo(
    () => ({
      siteName: initialBrandingSettings.siteName ?? '',
      tagline: initialBrandingSettings.tagline ?? '',
      companyName: initialBrandingSettings.companyName ?? '',
      companyAddress: initialBrandingSettings.companyAddress ?? '',
      footerYear: initialBrandingSettings.footerYear ? String(initialBrandingSettings.footerYear) : '',
      privacyPolicyText: initialBrandingSettings.privacyPolicyText ?? '',
      termsOfServiceText: initialBrandingSettings.termsOfServiceText ?? '',
      logoUrl: initialBrandingSettings.logoUrl ?? null,
      faviconUrl: initialBrandingSettings.faviconUrl ?? null,
    }),
    [initialBrandingSettings],
  )

  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [notifications, setNotifications] = useState(DEFAULT_NOTIFICATIONS)
  const [brandingSettings, setBrandingSettings] = useState<BrandingSettingsFormState>(() => ({
    ...DEFAULT_BRANDING_SETTINGS,
    siteName: normalizedInitialBranding.siteName,
    tagline: normalizedInitialBranding.tagline,
    companyName: normalizedInitialBranding.companyName,
    companyAddress: normalizedInitialBranding.companyAddress,
  }))
  const [brandingErrors, setBrandingErrors] = useState<
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
    setBrandingSettings({
      siteName: normalizedInitialBranding.siteName,
      tagline: normalizedInitialBranding.tagline,
      companyName: normalizedInitialBranding.companyName,
      companyAddress: normalizedInitialBranding.companyAddress,
      footerYear: normalizedInitialBranding.footerYear,
      privacyPolicyText: normalizedInitialBranding.privacyPolicyText,
      termsOfServiceText: normalizedInitialBranding.termsOfServiceText,
    })
    updateBranding({
      siteName: normalizedInitialBranding.siteName,
      tagline: normalizedInitialBranding.tagline,
      companyName: normalizedInitialBranding.companyName,
      companyAddress: normalizedInitialBranding.companyAddress,
      footerYear: normalizedInitialBranding.footerYear ? Number(normalizedInitialBranding.footerYear) : null,
      logoUrl: normalizedInitialBranding.logoUrl,
      faviconUrl: normalizedInitialBranding.faviconUrl,
    })
    setLoaded(true)
  }, [normalizedInitialBranding, updateBranding, setLoaded])

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const handleSaveNotifications = useCallback(() => {
    showToast('Notification preferences saved', 'success')
  }, [showToast])

  const handleSaveBrandingSettings = useCallback(async () => {
    const errorsMap: Partial<Record<'siteName' | 'companyName' | 'companyAddress', string>> = {}
    if (!brandingSettings.siteName.trim()) errorsMap.siteName = 'Site name is required'
    if (!brandingSettings.companyName.trim()) errorsMap.companyName = 'Company name is required'
    if (!brandingSettings.companyAddress.trim()) errorsMap.companyAddress = 'Company address is required'

    if (Object.keys(errorsMap).length > 0) {
      setBrandingErrors(errorsMap)
      const firstError = Object.values(errorsMap).find(Boolean)
      if (firstError) showToast(firstError, 'error')
      return
    }

    setIsSavingSettings(true)
    try {
      const payload: BrandingSettingsPayload = {
        siteName: brandingSettings.siteName,
        tagline: brandingSettings.tagline,
        companyName: brandingSettings.companyName,
        companyAddress: brandingSettings.companyAddress,
        footerYear: brandingSettings.footerYear ? Number(brandingSettings.footerYear) : null,
        privacyPolicyText: brandingSettings.privacyPolicyText,
        termsOfServiceText: brandingSettings.termsOfServiceText,
      }
      const data = await updateBrandingSettings(payload)
      updateBranding({
        siteName: data.siteName ?? brandingSettings.siteName,
        tagline: data.tagline ?? brandingSettings.tagline,
        companyName: data.companyName ?? brandingSettings.companyName,
        companyAddress: data.companyAddress ?? brandingSettings.companyAddress,
        footerYear: data.footerYear ?? (brandingSettings.footerYear ? Number(brandingSettings.footerYear) : null),
      })
      showToast('Settings saved', 'success')
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to save settings'
      showToast(message, 'error')
    } finally {
      setIsSavingSettings(false)
    }
  }, [brandingSettings, showToast, updateBranding])

  const handleLogoUpload = useCallback(
    async (file: File) => {
      try {
        const url = await uploadBrandingLogo(file)
        if (url) {
          updateBranding({ logoUrl: url })
          showToast('Logo updated', 'success')
        } else {
          showToast('Logo uploaded but no URL returned from server', 'error')
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to upload logo'
        showToast(message, 'error')
      }
    },
    [showToast, updateBranding],
  )

  const handleFaviconUpload = useCallback(
    async (file: File) => {
      try {
        const url = await uploadBrandingFavicon(file)
        if (url) {
          updateBranding({ faviconUrl: url })
          showToast('Favicon updated', 'success')
        } else {
          showToast('Favicon uploaded but no URL returned from server', 'error')
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to upload favicon'
        showToast(message, 'error')
      }
    },
    [showToast, updateBranding],
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
  }
}
