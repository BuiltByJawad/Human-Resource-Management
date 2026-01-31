'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'

import { useToast } from '@/components/ui/ToastProvider'
import type { LoginBranding } from '@/services/login/types'
import { loginAction } from '@/app/(public)/login/actions'

const loginSchema = yup.object().shape({
  email: yup.string().email('Invalid email address').required('Email is required'),
  password: yup.string().min(8, 'Password must be at least 8 characters').required('Password is required'),
  rememberMe: yup.boolean().default(false),
})

export type LoginFormData = yup.InferType<typeof loginSchema>

export function useLoginClient(branding: LoginBranding) {
  const router = useRouter()
  const { showToast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const isSubmittingRef = useRef(false)

  useEffect(() => {
    // avoid eager prefetching on the public login page to reduce client work
  }, [])

  const monogram = useMemo(() => {
    const words = branding.siteName?.split(' ').filter(Boolean)
    if (!words?.length) return 'HR'
    const initials = words.slice(0, 2).map((word) => word[0]?.toUpperCase()).join('')
    return initials || 'HR'
  }, [branding.siteName])

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

  const onSubmit = async (data: LoginFormData) => {
    if (isSubmittingRef.current) return
    isSubmittingRef.current = true
    setIsLoading(true)

    try {
      const result = await loginAction({
        email: data.email.trim(),
        password: data.password,
        rememberMe: !!data.rememberMe,
      })

      if (result?.error) {
        throw new Error(result.error)
      }

      showToast('Successfully logged in', 'success')
      const destination = result?.destination || '/dashboard'
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
