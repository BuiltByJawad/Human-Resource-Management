'use client'

import { useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'

import { useOptionalToast } from '@/components/ui/ToastProvider'
import { useAuthStore } from '@/store/useAuthStore'
import type { LoginBranding } from '@/services/login/types'
import { loginAction, verifyMfaAction } from '@/app/(public)/login/actions'

export interface LoginFormData {
  email: string
  password: string
  rememberMe: boolean
  mfaCode?: string
}

// Create schema once at module level
const loginSchema = yup.object().shape({
  email: yup.string().email('Invalid email address').required('Email is required'),
  password: yup.string().min(8, 'Password must be at least 8 characters').required('Password is required'),
  rememberMe: yup.boolean().default(false),
})

export function useLoginClient(branding: LoginBranding) {
  const router = useRouter()
  const { showToast } = useOptionalToast()
  const [isLoading, setIsLoading] = useState(false)
  const isSubmittingRef = useRef(false)
  const [isMfaStep, setIsMfaStep] = useState(false)
  const [mfaToken, setMfaToken] = useState<string | null>(null)

  const monogram = useMemo(() => {
    const words = branding.siteName?.split(' ').filter(Boolean) || []
    if (!words.length) return 'HR'
    return words.slice(0, 2).map((word) => word[0]?.toUpperCase()).join('') || 'HR'
  }, [branding.siteName])

  const { register, handleSubmit, formState: { errors }, setError, clearErrors } = useForm<LoginFormData>({
    defaultValues: { email: '', password: '', rememberMe: false, mfaCode: '' },
    resolver: yupResolver(loginSchema),
  })

  // Helper to update auth state
  const updateAuthState = (result: any) => {
    if (!result?.accessToken) return

    useAuthStore.setState((state) => ({
      ...state,
      token: result.accessToken,
      refreshToken: result.refreshToken || null,
      user: result.user ? { ...result.user, permissions: result.permissions || [] } : state.user,
      isAuthenticated: true,
      isLoggingOut: false,
      lastRefreshedAt: Date.now(),
    }))
  }

  // Helper to navigate after successful auth
  const navigateAfterAuth = async (result: any, message: string) => {
    try {
      useAuthStore.setState({ isAuthTransition: true, isLoggingOut: false })
    } catch {}

    await new Promise<void>((resolve) => {
      if (typeof window !== 'undefined') {
        window.requestAnimationFrame(() => resolve())
      } else {
        resolve()
      }
    })

    const destination = result?.mustSetupMfa 
      ? '/settings?mfaSetupRequired=1' 
      : result?.destination || '/dashboard'

    if (!result?.mustSetupMfa) {
      showToast(message, 'success')
    }

    router.replace(destination)
  }

  const onSubmit = async (data: LoginFormData) => {
    if (isSubmittingRef.current) return
    
    isSubmittingRef.current = true
    setIsLoading(true)
    clearErrors()

    try {
      // Wait for auth hydration if needed
      if (!useAuthStore.persist.hasHydrated()) {
        await new Promise<void>((resolve) => {
          const unsub = useAuthStore.persist.onFinishHydration(() => {
            unsub()
            resolve()
          })
        })
      }

      // MFA verification step
      if (isMfaStep && mfaToken) {
        const code = data.mfaCode?.trim()
        if (!code) {
          setError('mfaCode', { type: 'manual', message: 'Authentication code is required' })
          return
        }

        const result = await verifyMfaAction({ mfaToken, code, rememberMe: !!data.rememberMe })

        if (result?.error) {
          setError('mfaCode', { type: 'manual', message: result.error })
          return
        }

        updateAuthState(result)
        await navigateAfterAuth(result, 'MFA verification successful')
        
        setIsMfaStep(false)
        setMfaToken(null)
        return
      }

      // Initial login step
      const result = await loginAction({
        email: data.email.trim(),
        password: data.password,
        rememberMe: !!data.rememberMe,
      })

      if (result?.error) {
        setError('password', { type: 'manual', message: result.error })
        return
      }

      // Handle MFA requirement
      if (result?.requiresMfa && result.mfaToken) {
        setIsMfaStep(true)
        setMfaToken(result.mfaToken)
        showToast('Enter your authentication code to complete sign-in', 'info')
        return
      }

      // Complete login without MFA
      updateAuthState(result)
      await navigateAfterAuth(result, 'Successfully logged in')

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to login'
      const isInvalidCredentials = /invalid (credentials|email|password)|incorrect password/i.test(message)

      if (isInvalidCredentials) {
        setError('password', { type: 'manual', message: 'Invalid email or password' })
      } else {
        showToast(message, 'error')
      }

      try {
        useAuthStore.getState().endAuthTransition()
      } catch {}
    } finally {
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
    isMfaStep,
    onSubmit,
  }
}