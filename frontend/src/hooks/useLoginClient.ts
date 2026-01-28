'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'

import { useToast } from '@/components/ui/ToastProvider'
import { useAuthStore } from '@/store/useAuthStore'
import { useBrandingStore } from '@/store/useBrandingStore'
import type { LoginBranding } from '@/services/login/types'

const loginSchema = yup.object().shape({
  email: yup.string().email('Invalid email address').required('Email is required'),
  password: yup.string().min(8, 'Password must be at least 8 characters').required('Password is required'),
  rememberMe: yup.boolean().default(false),
})

export type LoginFormData = yup.InferType<typeof loginSchema>

export function useLoginClient(branding: LoginBranding) {
  const router = useRouter()
  const { login, isAuthTransition, endAuthTransition, isAuthenticated } = useAuthStore()
  const { updateBranding } = useBrandingStore()
  const { showToast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const isSubmittingRef = useRef(false)

  useEffect(() => {
    if (!isAuthTransition) return
    if (isAuthenticated) return
    endAuthTransition()
  }, [isAuthTransition, isAuthenticated, endAuthTransition])

  useEffect(() => {
    router.prefetch('/dashboard')
    router.prefetch('/employees')
  }, [router])

  useEffect(() => {
    updateBranding({
      siteName: branding.siteName ?? '',
      tagline: branding.tagline ?? '',
      companyName: branding.companyName ?? '',
      companyAddress: branding.companyAddress ?? '',
      logoUrl: branding.logoUrl ?? null,
      faviconUrl: branding.faviconUrl ?? null,
    })
  }, [branding, updateBranding])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: yupResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  })

  const monogram = useMemo(() => {
    const words = branding.siteName?.split(' ').filter(Boolean)
    if (!words?.length) return 'HR'
    const initials = words.slice(0, 2).map((word) => word[0]?.toUpperCase()).join('')
    return initials || 'HR'
  }, [branding.siteName])

  const onSubmit = async (data: LoginFormData) => {
    if (isSubmittingRef.current) return
    isSubmittingRef.current = true
    setIsLoading(true)

    try {
      await login(data.email, data.password, { rememberMe: data.rememberMe })
      showToast('Successfully logged in', 'success')

      const role = useAuthStore.getState().user?.role
      const isAdminRole = typeof role === 'string' && role.toLowerCase().includes('admin')
      const destination = isAdminRole ? '/dashboard' : '/employees'
      if (typeof window !== 'undefined') {
        window.location.href = destination
      } else {
        router.replace(destination)
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to login'
      showToast(message, 'error')
      setIsLoading(false)
      isSubmittingRef.current = false
    }
  }

  return {
    register,
    handleSubmit,
    errors,
    isLoading,
    monogram,
    onSubmit,
  }
}
