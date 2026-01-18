'use client'

import { useEffect, useMemo, useState } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { format } from 'date-fns'

import { useAuthStore } from '@/store/useAuthStore'
import { useToast } from '@/components/ui/ToastProvider'
import { fetchProfile, updateProfile, uploadProfileAvatar } from '@/services/profile'
import type { ProfileFormValues, UpdateProfilePayload } from '@/services/profile/types'
type AuthUser = NonNullable<ReturnType<typeof useAuthStore.getState>['user']>
type UpdateUserPayload = Partial<AuthUser>

interface ProfileEmployeeContact {
  name?: string
  relationship?: string
  phone?: string
}

interface ProfileEmployee {
  id?: string
  employeeNumber?: string
  phoneNumber?: string
  address?: string
  dateOfBirth?: string
  hireDate?: string
  gender?: string
  maritalStatus?: string
  emergencyContact?: ProfileEmployeeContact
}

interface ProfileUser {
  id?: string
  email?: string | null
  firstName?: string | null
  lastName?: string | null
  role?: string | null
  department?: string | null
  status?: string | null
  avatarUrl?: string | null
  phoneNumber?: string
  address?: string
  dateOfBirth?: string
  gender?: string
  maritalStatus?: string
  employee?: ProfileEmployee
}

const profileSchema: yup.ObjectSchema<ProfileFormValues> = yup.object({
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

const buildFormValues = (user: ProfileUser | null): ProfileFormValues => {
  const employeeData = user?.employee ?? {}
  return {
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phoneNumber: employeeData.phoneNumber || user?.phoneNumber || '',
    address: employeeData.address || user?.address || '',
    dateOfBirth: employeeData.dateOfBirth ? format(new Date(employeeData.dateOfBirth), 'yyyy-MM-dd') : '',
    gender: employeeData.gender || user?.gender || '',
    maritalStatus: employeeData.maritalStatus || user?.maritalStatus || '',
    emergencyContactName: employeeData.emergencyContact?.name || '',
    emergencyContactRelation: employeeData.emergencyContact?.relationship || '',
    emergencyContactPhone: employeeData.emergencyContact?.phone || '',
  }
}

export const useProfilePage = () => {
  const { user: authUser, updateUser } = useAuthStore()
  const user = authUser as ProfileUser | null
  const { showToast } = useToast()
  const [activeTab, setActiveTab] = useState<'personal' | 'professional'>('personal')
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const resolver = useMemo(() => yupResolver(profileSchema) as Resolver<ProfileFormValues>, [])

  const form = useForm<ProfileFormValues>({
    resolver,
    defaultValues: buildFormValues(user),
  })

  useEffect(() => {
    form.reset(buildFormValues(user))
  }, [user, form])

  const handleAvatarUpload = async (file: File) => {
    const formData = new FormData()
    formData.append('avatar', file)

    try {
      const uploadedAvatarUrl = await uploadProfileAvatar(formData)

      if (uploadedAvatarUrl) {
        updateUser({ avatarUrl: uploadedAvatarUrl })
      }

      const profileResponse = await fetchProfile()
      if (profileResponse?.user) {
        updateUser({
          ...profileResponse.user,
          avatarUrl:
            uploadedAvatarUrl ??
            (profileResponse.user as { avatarUrl?: string | null }).avatarUrl ??
            user?.avatarUrl ??
            null,
        })
      }
      showToast('Profile photo updated', 'success')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to upload photo'
      showToast(message, 'error')
    }
  }

  const onSubmit = async (data: ProfileFormValues) => {
    if (!user) {
      showToast('Unable to update profile', 'error')
      return
    }
    setIsLoading(true)
    try {
      const payload: UpdateProfilePayload = {
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
          phone: data.emergencyContactPhone,
        },
      }

      const result = await updateProfile(payload)
      const updatedBasic = result.user || {}
      const updatedEmployee = result.employee || {}

      const nextUser: ProfileUser = {
        ...user,
        ...updatedBasic,
        employee: {
          ...(user.employee || { id: user.id }),
          ...updatedEmployee,
        },
      }

      updateUser(nextUser as UpdateUserPayload)
      form.reset(buildFormValues(nextUser))
      setIsEditing(false)
      showToast('Profile updated successfully', 'success')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch {
      showToast('Failed to update profile', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => form.reset(buildFormValues(user))

  return {
    user,
    form,
    activeTab,
    setActiveTab,
    isEditing,
    setIsEditing,
    isLoading,
    handleAvatarUpload,
    onSubmit,
    resetForm,
  }
}
