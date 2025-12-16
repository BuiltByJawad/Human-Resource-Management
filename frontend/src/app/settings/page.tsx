"use client"

import { useMemo, useState, useEffect, useCallback } from 'react'
import api from '@/app/api/api'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { Input } from '@/components/ui/FormComponents'
import { Modal } from '@/components/ui/Modal'
import AvatarUpload from '@/components/ui/AvatarUpload'
import { useToast } from '@/components/ui/ToastProvider'
import { useAuthStore } from '@/store/useAuthStore'
import { useOrgStore } from '@/store/useOrgStore'
import { PERMISSIONS } from '@/constants/permissions'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { useRouter } from 'next/navigation'

const passwordSchema = yup.object().shape({
    currentPassword: yup.string().required('Current password is required'),
    newPassword: yup.string()
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
            }
        ),
    confirmPassword: yup.string()
        .oneOf([yup.ref('newPassword')], 'Passwords must match')
        .required('Confirm password is required'),
})

type PasswordFormData = yup.InferType<typeof passwordSchema>

export default function SettingsPage() {
    const router = useRouter()
    const [showPasswordModal, setShowPasswordModal] = useState(false)
    const [isChangingPassword, setIsChangingPassword] = useState(false)
    const [notifications, setNotifications] = useState({
        emailNotifs: true,
        pushNotifs: false
    })

    // Org Settings State
    const [orgSettings, setOrgSettings] = useState({
        siteName: '',
        tagline: '',
        companyName: '',
        companyAddress: ''
    })
    const [isSavingSettings, setIsSavingSettings] = useState(false)
    const [isMounted, setIsMounted] = useState(false)

    const { register, handleSubmit, reset, formState: { errors } } = useForm<PasswordFormData>({
        resolver: yupResolver(passwordSchema),
        defaultValues: {
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
        }
    })

    const { user, hasPermission } = useAuthStore()
    const { updateOrg, logoUrl, faviconUrl } = useOrgStore()
    const { showToast } = useToast()

    // Fetch settings on mount
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await api.get('/org/settings')
                if (res.data.success) {
                    const data = res.data.data
                    setOrgSettings({
                        siteName: data.siteName || '',
                        tagline: data.tagline || '',
                        companyName: data.companyName || '',
                        companyAddress: data.companyAddress || ''
                    })
                    // Also update store
                    updateOrg({
                        siteName: data.siteName,
                        tagline: data.tagline,
                        companyName: data.companyName,
                        companyAddress: data.companyAddress,
                        logoUrl: data.logoUrl,
                        faviconUrl: data.faviconUrl
                    })
                }
            } catch (error) {
                console.error('Failed to fetch settings', error)
            }
        }
        fetchSettings()
    }, [updateOrg])

    useEffect(() => {
        setIsMounted(true)
    }, [])

    const handleSaveNotifications = useCallback(() => {
        // In a real app, this would save to backend
        showToast('Notification preferences saved', 'success')
    }, [showToast])

    const handleSaveOrgSettings = useCallback(async () => {
        setIsSavingSettings(true)
        try {
            const res = await api.put('/org/settings', orgSettings)
            if (res.data.success) {
                const data = res.data.data
                updateOrg({
                    siteName: data.siteName,
                    tagline: data.tagline,
                    companyName: data.companyName,
                    companyAddress: data.companyAddress
                })
                showToast('Organization settings saved', 'success')
            }
        } catch (error: any) {
            const message =
                error?.response?.data?.error?.message ||
                error?.response?.data?.message ||
                error?.message ||
                'Failed to save settings'
            showToast(message, 'error')
        } finally {
            setIsSavingSettings(false)
        }
    }, [orgSettings, showToast, updateOrg])

    const handleLogoUpload = useCallback(async (file: File) => {
        const formData = new FormData()
        formData.append('logo', file)

        try {
            const res = await api.post('/org/branding/logo', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            })
            const url = res.data?.data?.logoUrl || res.data?.logoUrl
            if (url) {
                updateOrg({ logoUrl: url })
                showToast('Logo updated', 'success')
            } else {
                showToast('Logo uploaded but no URL returned from server', 'error')
            }
        } catch (error: any) {
            const message =
                error?.response?.data?.error?.message ||
                error?.response?.data?.message ||
                error?.message ||
                'Failed to upload logo'
            showToast(message, 'error')
        }
    }, [showToast, updateOrg])

    const handleFaviconUpload = useCallback(async (file: File) => {
        const formData = new FormData()
        formData.append('favicon', file)

        try {
            const res = await api.post('/org/branding/favicon', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            })
            const url = res.data?.data?.faviconUrl || res.data?.faviconUrl
            if (url) {
                updateOrg({ faviconUrl: url })
                showToast('Favicon updated', 'success')
            } else {
                showToast('Favicon uploaded but no URL returned from server', 'error')
            }
        } catch (error: any) {
            const message =
                error?.response?.data?.error?.message ||
                error?.response?.data?.message ||
                error?.message ||
                'Failed to upload favicon'
            showToast(message, 'error')
        }
    }, [showToast, updateOrg])

    const adminSections = useMemo(() => ([
        {
            permission: PERMISSIONS.MANAGE_NOTIFICATIONS,
            title: 'Notifications',
            description: 'Manage how your organization receives system notifications.',
            content: (
                <div className="space-y-4">
                    <div className="flex items-center">
                        <input
                            id="email-notifs"
                            name="email-notifs"
                            type="checkbox"
                            checked={notifications.emailNotifs}
                            onChange={(e) => setNotifications({ ...notifications, emailNotifs: e.target.checked })}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor="email-notifs" className="ml-3 text-sm text-gray-700">
                            Email notifications
                        </label>
                    </div>
                    <div className="flex items-center">
                        <input
                            id="push-notifs"
                            name="push-notifs"
                            type="checkbox"
                            checked={notifications.pushNotifs}
                            onChange={(e) => setNotifications({ ...notifications, pushNotifs: e.target.checked })}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor="push-notifs" className="ml-3 text-sm text-gray-700">
                            Push notifications
                        </label>
                    </div>
                    <div>
                        <button
                            onClick={handleSaveNotifications}
                            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            Save preferences
                        </button>
                    </div>
                </div>
            )
        },
        {
            permission: PERMISSIONS.MANAGE_ROLES,
            title: 'Roles & Permissions',
            description: 'Create roles, assign permissions, and control access across the organization.',
            action: () => router.push('/roles'),
            actionLabel: 'Manage roles'
        },
        {
            permission: PERMISSIONS.CONFIGURE_PAYROLL,
            title: 'Payroll Configuration',
            description: 'Define pay cycles, tax rules, and payroll policies.',
            action: () => router.push('/payroll'),
            actionLabel: 'Go to payroll settings'
        },
        {
            permission: PERMISSIONS.MANAGE_COMPLIANCE,
            title: 'Compliance & Policies',
            description: 'Set up compliance rules and audit your HR policies.',
            action: () => router.push('/compliance'),
            actionLabel: 'Manage compliance'
        },
        {
            permission: PERMISSIONS.MANAGE_SYSTEM_SETTINGS,
            title: 'Organization Branding',
            description: 'Configure the name, logo, and public identity of your HR workspace.',
            content: (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <p className="text-sm font-medium text-gray-900">Logo</p>
                            <p className="text-xs text-gray-500">Upload your company logo. This appears in the sidebar and mobile menu.</p>
                            <AvatarUpload
                                currentAvatarUrl={logoUrl || undefined}
                                onUpload={handleLogoUpload}
                                className="flex-col !items-start"
                            />
                        </div>
                        <div className="space-y-3">
                            <p className="text-sm font-medium text-gray-900">Favicon</p>
                            <p className="text-xs text-gray-500">Upload a small square icon shown in the browser tab.</p>
                            <AvatarUpload
                                currentAvatarUrl={faviconUrl || undefined}
                                onUpload={handleFaviconUpload}
                                className="flex-col !items-start"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="Site Name"
                            value={orgSettings.siteName}
                            onChange={(e) => setOrgSettings({ ...orgSettings, siteName: e.target.value })}
                        />
                        <Input
                            label="Tagline"
                            value={orgSettings.tagline}
                            onChange={(e) => setOrgSettings({ ...orgSettings, tagline: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="Company Name (for payslips)"
                            value={orgSettings.companyName}
                            onChange={(e) => setOrgSettings({ ...orgSettings, companyName: e.target.value })}
                        />
                        <Input
                            label="Company Address (for payslips)"
                            value={orgSettings.companyAddress}
                            onChange={(e) => setOrgSettings({ ...orgSettings, companyAddress: e.target.value })}
                        />
                    </div>
                    <div className="flex justify-end">
                        <button
                            onClick={handleSaveOrgSettings}
                            disabled={isSavingSettings}
                            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                            {isSavingSettings ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            )
        }
    ]), [
        notifications,
        handleSaveNotifications,
        orgSettings,
        isSavingSettings,
        logoUrl,
        faviconUrl,
        router,
        handleFaviconUpload,
        handleLogoUpload,
        handleSaveOrgSettings
    ])

    const onSubmit = async (data: PasswordFormData) => {
        setIsChangingPassword(true)
        try {
            await api.put('/auth/change-password', {
                currentPassword: data.currentPassword,
                newPassword: data.newPassword
            })
            showToast('Password changed successfully', 'success')
            setShowPasswordModal(false)
            reset()
        } catch (error: any) {
            showToast(error.response?.data?.message || 'Failed to change password', 'error')
        } finally {
            setIsChangingPassword(false)
        }
    }

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
        <div className="min-h-screen bg-gray-50/50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
                <div className="mb-6">
                <button
                    onClick={() => router.back()}
                    className="inline-flex items-center justify-center p-2 rounded-full hover:bg-gray-200 transition-colors text-gray-500 hover:text-gray-900"
                    aria-label="Go back"
                >
                    <ArrowLeftIcon className="h-6 w-6" />
                </button>
            </div>

                <h1 className="text-2xl font-bold text-gray-900 mb-8">Settings</h1>

                <div className="space-y-6">
                {/* Organization / admin sections */}
                {adminSections
                    .filter((section) => hasPermission(section.permission))
                    .map((section) => (
                        <div key={section.permission} className="bg-white shadow rounded-lg p-6 border border-gray-100">
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

                {/* Personal sections */}
                {hasPermission(PERMISSIONS.CHANGE_OWN_PASSWORD) && (
                    <div className="bg-white shadow rounded-lg p-6 border border-gray-100">
                        <h2 className="text-lg font-semibold text-gray-900">Security</h2>
                        <p className="mt-1 text-sm text-gray-500">Manage your password and keep your account secure.</p>
                        <div className="mt-4">
                            <button
                                onClick={() => {
                                    setShowPasswordModal(true)
                                    reset()
                                }}
                                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                Change password
                            </button>
                        </div>
                    </div>
                )}

                {hasPermission(PERMISSIONS.UPDATE_OWN_NOTIFICATIONS) && (
                    <div className="bg-white shadow rounded-lg p-6 border border-gray-100">
                        <h2 className="text-lg font-semibold text-gray-900">My notifications</h2>
                        <p className="mt-1 text-sm text-gray-500">Choose how you want to be notified about HR updates.</p>
                        <div className="mt-4 space-y-4">
                            <div className="flex items-center">
                                <input
                                    id="personal-email-notifs"
                                    name="personal-email-notifs"
                                    type="checkbox"
                                    checked={notifications.emailNotifs}
                                    onChange={(e) => setNotifications({ ...notifications, emailNotifs: e.target.checked })}
                                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <label htmlFor="personal-email-notifs" className="ml-3 text-sm text-gray-700">
                                    Email notifications
                                </label>
                            </div>
                            <div className="flex items-center">
                                <input
                                    id="personal-push-notifs"
                                    name="personal-push-notifs"
                                    type="checkbox"
                                    checked={notifications.pushNotifs}
                                    onChange={(e) => setNotifications({ ...notifications, pushNotifs: e.target.checked })}
                                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <label htmlFor="personal-push-notifs" className="ml-3 text-sm text-gray-700">
                                    Push notifications
                                </label>
                            </div>
                            <div>
                                <button
                                    onClick={handleSaveNotifications}
                                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    Save my preferences
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <Modal
                isOpen={showPasswordModal}
                onClose={() => {
                    setShowPasswordModal(false)
                    reset()
                }}
                title="Change Password"
            >
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <Input
                        label="Current Password"
                        type="password"
                        required
                        error={errors.currentPassword?.message}
                        {...register('currentPassword')}
                    />
                    <Input
                        label="New Password"
                        type="password"
                        required
                        error={errors.newPassword?.message}
                        {...register('newPassword')}
                    />
                    <Input
                        label="Confirm New Password"
                        type="password"
                        required
                        error={errors.confirmPassword?.message}
                        {...register('confirmPassword')}
                    />
                    <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse gap-3">
                        <button
                            type="submit"
                            disabled={isChangingPassword}
                            className="inline-flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto sm:text-sm disabled:opacity-50"
                        >
                            {isChangingPassword ? 'Changing...' : 'Change Password'}
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setShowPasswordModal(false)
                                reset()
                            }}
                            className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:mt-0 sm:w-auto sm:text-sm"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </Modal>
            </div>
        </div>
    )
}
