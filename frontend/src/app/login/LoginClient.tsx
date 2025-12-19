'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'

import { Button, Input } from '@/components/ui/FormComponents'
import { useToast } from '@/components/ui/ToastProvider'
import { useAuthStore } from '@/store/useAuthStore'

const loginSchema = yup.object().shape({
  email: yup.string().email('Invalid email address').required('Email is required'),
  password: yup.string().min(8, 'Password must be at least 8 characters').required('Password is required')
})

type LoginFormData = yup.InferType<typeof loginSchema>

export type LoginHighlight = {
  title: string
  description: string
}

export type LoginBranding = {
  siteName: string
  tagline?: string
  heroTitle: string
  heroSubtitle: string
  highlights: LoginHighlight[]
  logoUrl?: string | null
  companyName?: string
  companyAddress?: string
}

interface LoginClientProps {
  branding: LoginBranding
}

export default function LoginClient({ branding }: LoginClientProps) {
  const router = useRouter()
  const { login } = useAuthStore()
  const { showToast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const isSubmittingRef = useRef(false)

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginFormData>({
    resolver: yupResolver(loginSchema),
    defaultValues: {
      email: '',
      password: ''
    }
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
      await login(data.email, data.password)
      showToast('Successfully logged in', 'success')
      router.push('/employees')
    } catch (error: any) {
      showToast(error?.message || 'Failed to login', 'error')
    } finally {
      setIsLoading(false)
      isSubmittingRef.current = false
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex flex-col items-center space-y-4">
          {branding.logoUrl ? (
            <Image
              src={branding.logoUrl}
              alt={`${branding.siteName} logo`}
              width={64}
              height={64}
              className="h-16 w-16 rounded-2xl bg-white object-contain shadow-lg ring-1 ring-gray-100"
              priority
            />
          ) : (
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-2xl">{monogram}</span>
            </div>
          )}

          <div className="text-center space-y-2">
            <p className="text-sm uppercase tracking-[0.2em] text-blue-600 font-semibold">
              {branding.siteName || 'HR Portal'}
            </p>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">{branding.heroTitle}</h2>
            <p className="text-sm text-gray-600">{branding.heroSubtitle || branding.tagline}</p>
          </div>
        </div>

        <div className="mt-6 space-y-4 text-sm text-gray-600">
          {branding.highlights?.map((highlight) => (
            <div key={highlight.title} className="flex items-start space-x-3">
              <span className="mt-1 h-2 w-2 rounded-full bg-blue-600"></span>
              <div>
                <p className="font-medium text-gray-900">{highlight.title}</p>
                <p className="text-gray-600">{highlight.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <Input
              label="Email address"
              type="email"
              placeholder="you@example.com"
              required
              showRequiredIndicator={false}
              error={errors.email?.message}
              {...register('email')}
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              required
              showRequiredIndicator={false}
              error={errors.password?.message}
              {...register('password')}
            />

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <Link href="/auth/request-password-reset" className="font-medium text-blue-600 hover:text-blue-500">
                  Forgot your password?
                </Link>
              </div>
            </div>

            <div>
              <Button type="submit" variant="primary" className="w-full justify-center" disabled={isLoading}>
                {isLoading ? 'Signing in...' : 'Sign in'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
