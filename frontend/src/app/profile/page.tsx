'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/features/auth'
import { fetchProfile, updateProfile, uploadAvatar } from '@/features/auth'
import AvatarUpload from '@/components/ui/AvatarUpload'
import { UserCircleIcon, BriefcaseIcon, ArrowLeftIcon } from '@heroicons/react/24/outline'
import { DatePicker } from '@/components/ui/FormComponents'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { useToast } from '@/components/ui/ToastProvider'
import { format } from 'date-fns'

const profileSchema = yup.object().shape({
    firstName: yup.string().required('First name is required'),
    lastName: yup.string().required('Last name is required'),
    phoneNumber: yup.string().required('Phone number is required'),
    address: yup.string().required('Address is required'),
    dateOfBirth: yup.string().required('Date of birth is required'),
    gender: yup.string().required('Gender is required'),
    maritalStatus: yup.string().required('Marital status is required'),
    emergencyContactName: yup.string().default(''),
    emergencyContactRelation: yup.string().default(''),
    emergencyContactPhone: yup.string().default(''),
})

type ProfileFormData = yup.InferType<typeof profileSchema>

export default function ProfilePage() {
    const router = useRouter()
    const { user, updateUser, token } = useAuth()
    const { showToast } = useToast()
    const [activeTab, setActiveTab] = useState('personal')
    const [isEditing, setIsEditing] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    const { register, handleSubmit, control, reset, formState: { errors } } = useForm({
        resolver: yupResolver(profileSchema) as any,
        defaultValues: {
            firstName: '',
            lastName: '',
            phoneNumber: '',
            address: '',
            dateOfBirth: '',
            gender: '',
            maritalStatus: '',
            emergencyContactName: '',
            emergencyContactRelation: '',
            emergencyContactPhone: ''
        }
    })

    useEffect(() => {
        if (user) {
            const employeeData = user.employee || {}
            reset({
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                phoneNumber: employeeData.phoneNumber || user.phoneNumber || '',
                address: employeeData.address || user.address || '',
                dateOfBirth: employeeData.dateOfBirth
                    ? format(new Date(employeeData.dateOfBirth), 'yyyy-MM-dd')
                    : '',
                gender: employeeData.gender || user.gender || '',
                maritalStatus: employeeData.maritalStatus || user.maritalStatus || '',
                emergencyContactName: employeeData.emergencyContact?.name || '',
                emergencyContactRelation: employeeData.emergencyContact?.relationship || '',
                emergencyContactPhone: employeeData.emergencyContact?.phone || ''
            })
        }
    }, [user, reset])

    const handleAvatarUpload = async (file: File) => {
        try {
            if (!token) {
                showToast('You are not logged in.', 'error')
                return
            }

            const { avatarUrl: uploadedAvatarUrl } = await uploadAvatar(file, token)

            if (uploadedAvatarUrl) {
                updateUser({ avatarUrl: uploadedAvatarUrl })
            }

            const profileUser = await fetchProfile(token)
            if (profileUser) {
                updateUser({
                    ...profileUser,
                    avatarUrl: uploadedAvatarUrl ?? profileUser?.avatarUrl ?? user?.avatarUrl ?? null,
                })
            }
            showToast('Profile photo updated', 'success')
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to upload photo'
            showToast(message, 'error')
        }
    }

    const onSubmit = async (data: any) => {
        setIsLoading(true)
        try {
            const payload = {
                firstName: data.firstName,
                lastName: data.lastName,
                phoneNumber: data.phoneNumber,
                address: data.address,
                dateOfBirth: data.dateOfBirth,
                gender: data.gender,
                maritalStatus: data.maritalStatus,
                emergencyContact: {
                    name: data.emergencyContactName,
                    relationship: data.emergencyContactRelation,
                    phone: data.emergencyContactPhone
                }
            }

            const result = await updateProfile(payload, token)

            const updatedBasic = result.user || {}
            const updatedEmployee = result.employee || {}

            const nextUser = {
                ...(user || {}),
                ...updatedBasic,
                employee: {
                    ...((user || {}).employee || {}),
                    ...updatedEmployee
                }
            }

            updateUser(nextUser)

            const finalEmployee = nextUser.employee || {}
            reset({
                firstName: nextUser.firstName || '',
                lastName: nextUser.lastName || '',
                phoneNumber: finalEmployee.phoneNumber || nextUser.phoneNumber || '',
                address: finalEmployee.address || nextUser.address || '',
                dateOfBirth: finalEmployee.dateOfBirth
                    ? format(new Date(finalEmployee.dateOfBirth), 'yyyy-MM-dd')
                    : '',
                gender: finalEmployee.gender || nextUser.gender || '',
                maritalStatus: finalEmployee.maritalStatus || nextUser.maritalStatus || '',
                emergencyContactName: finalEmployee.emergencyContact?.name || '',
                emergencyContactRelation: finalEmployee.emergencyContact?.relationship || '',
                emergencyContactPhone: finalEmployee.emergencyContact?.phone || ''
            })

            setIsEditing(false)
            showToast('Profile updated successfully', 'success')
            window.scrollTo({ top: 0, behavior: 'smooth' })
        } catch (error) {
            showToast('Failed to update profile', 'error')
        } finally {
            setIsLoading(false)
        }
    }

    if (!user) return null

    return (
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <div className="mb-6">
                <button
                    onClick={() => router.back()}
                    className="inline-flex items-center justify-center p-2 rounded-full hover:bg-gray-200 transition-colors text-gray-500 hover:text-gray-900"
                    aria-label="Go back"
                >
                    <ArrowLeftIcon className="h-6 w-6" />
                </button>
            </div>

            <div className="md:flex md:gap-6">
                {/* Sidebar / Tabs */}
                <div className="w-full md:w-64 mb-6 md:mb-0">
                    <div className="bg-white shadow rounded-lg overflow-hidden">
                        <div className="p-6 text-center border-b border-gray-200">
                            <div className="flex justify-center">
                                <AvatarUpload
                                    currentAvatarUrl={user.avatarUrl || `https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}`}
                                    onUpload={handleAvatarUpload}
                                    disabled={!isEditing}
                                    className="flex-col !gap-4"
                                />
                            </div>
                            <h3 className="mt-4 text-lg font-medium text-gray-900">{user.firstName} {user.lastName}</h3>
                            <p className="text-sm text-gray-500">{user.role}</p>
                        </div>
                        <nav className="p-2 space-y-1">
                            <button
                                onClick={() => setActiveTab('personal')}
                                className={`w-full flex items-center px-4 py-2 text-sm font-medium rounded-md ${activeTab === 'personal'
                                    ? 'bg-blue-50 text-blue-700'
                                    : 'text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                <UserCircleIcon className="mr-3 h-5 w-5" />
                                Personal Information
                            </button>
                            <button
                                onClick={() => setActiveTab('professional')}
                                className={`w-full flex items-center px-4 py-2 text-sm font-medium rounded-md ${activeTab === 'professional'
                                    ? 'bg-blue-50 text-blue-700'
                                    : 'text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                <BriefcaseIcon className="mr-3 h-5 w-5" />
                                Professional Details
                            </button>
                        </nav>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1">
                    <div className="bg-white shadow rounded-lg">
                        {activeTab === 'personal' && (
                            <div className="p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-xl font-bold text-gray-900">Personal Information</h2>
                                    {!isEditing && (
                                        <button
                                            onClick={() => setIsEditing(true)}
                                            className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                                        >
                                            Edit Profile
                                        </button>
                                    )}
                                </div>

                                <form onSubmit={handleSubmit(onSubmit)}>
                                    <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">
                                                First Name <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                disabled={!isEditing}
                                                {...register('firstName')}
                                                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2 disabled:bg-gray-50 ${errors.firstName ? 'border-red-500' : ''}`}
                                            />
                                            {errors.firstName && <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">
                                                Last Name <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                disabled={!isEditing}
                                                {...register('lastName')}
                                                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2 disabled:bg-gray-50 ${errors.lastName ? 'border-red-500' : ''}`}
                                            />
                                            {errors.lastName && <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">
                                                Phone Number <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="tel"
                                                disabled={!isEditing}
                                                {...register('phoneNumber')}
                                                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2 disabled:bg-gray-50 ${errors.phoneNumber ? 'border-red-500' : ''}`}
                                            />
                                            {errors.phoneNumber && <p className="mt-1 text-sm text-red-600">{errors.phoneNumber.message}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">
                                                Date of Birth <span className="text-red-500">*</span>
                                            </label>
                                            <Controller
                                                control={control}
                                                name="dateOfBirth"
                                                render={({ field }) => (
                                                    <DatePicker
                                                        value={field.value || ''}
                                                        onChange={(date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : '')}
                                                        disabled={!isEditing}
                                                        className="mt-1 block w-full"
                                                        inputClassName={`w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 disabled:bg-gray-50 ${errors.dateOfBirth ? 'border-red-500' : ''}`}
                                                        placeholder="Select date"
                                                    />
                                                )}
                                            />
                                            {errors.dateOfBirth && <p className="mt-1 text-sm text-red-600">{errors.dateOfBirth.message}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">
                                                Gender <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                disabled={!isEditing}
                                                {...register('gender')}
                                                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2 disabled:bg-gray-50 ${errors.gender ? 'border-red-500' : ''}`}
                                            >
                                                <option value="">Select Gender</option>
                                                <option value="male">Male</option>
                                                <option value="female">Female</option>
                                                <option value="other">Other</option>
                                            </select>
                                            {errors.gender && <p className="mt-1 text-sm text-red-600">{errors.gender.message}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">
                                                Marital Status <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                disabled={!isEditing}
                                                {...register('maritalStatus')}
                                                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2 disabled:bg-gray-50 ${errors.maritalStatus ? 'border-red-500' : ''}`}
                                            >
                                                <option value="">Select Status</option>
                                                <option value="single">Single</option>
                                                <option value="married">Married</option>
                                                <option value="divorced">Divorced</option>
                                                <option value="widowed">Widowed</option>
                                            </select>
                                            {errors.maritalStatus && <p className="mt-1 text-sm text-red-600">{errors.maritalStatus.message}</p>}
                                        </div>
                                        <div className="sm:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700">
                                                Address <span className="text-red-500">*</span>
                                            </label>
                                            <textarea
                                                rows={3}
                                                disabled={!isEditing}
                                                {...register('address')}
                                                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2 disabled:bg-gray-50 ${errors.address ? 'border-red-500' : ''}`}
                                            />
                                            {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>}
                                        </div>
                                    </div>

                                    <div className="mt-8">
                                        <h3 className="text-lg font-medium text-gray-900 mb-4">Emergency Contact</h3>
                                        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-3">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Name</label>
                                                <input
                                                    type="text"
                                                    disabled={!isEditing}
                                                    {...register('emergencyContactName')}
                                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2 disabled:bg-gray-50"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Relationship</label>
                                                <input
                                                    type="text"
                                                    disabled={!isEditing}
                                                    {...register('emergencyContactRelation')}
                                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2 disabled:bg-gray-50"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Phone</label>
                                                <input
                                                    type="tel"
                                                    disabled={!isEditing}
                                                    {...register('emergencyContactPhone')}
                                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2 disabled:bg-gray-50"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {isEditing && (
                                        <div className="mt-6 flex justify-end space-x-3">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setIsEditing(false)
                                                    reset() // Reset form to original values on cancel
                                                }}
                                                className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={isLoading}
                                                className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                                            >
                                                {isLoading ? 'Saving...' : 'Save Changes'}
                                            </button>
                                        </div>
                                    )}
                                </form>
                            </div>
                        )}

                        {activeTab === 'professional' && (
                            <div className="p-6">
                                <h2 className="text-xl font-bold text-gray-900 mb-6">Professional Details</h2>
                                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500">Employee ID</label>
                                        <p className="mt-1 text-sm text-gray-900">{user.employee?.employeeNumber || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500">Department</label>
                                        <p className="mt-1 text-sm text-gray-900">{user.department || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500">Role</label>
                                        <p className="mt-1 text-sm text-gray-900">{user.role}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500">Email</label>
                                        <p className="mt-1 text-sm text-gray-900">{user.email}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500">Hire Date</label>
                                        <p className="mt-1 text-sm text-gray-900">
                                            {user.employee?.hireDate ? new Date(user.employee.hireDate).toLocaleDateString() : 'N/A'}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500">Status</label>
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            {user.status || 'Active'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
