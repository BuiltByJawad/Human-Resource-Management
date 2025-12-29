'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'

import { Button, Input } from '@/components/ui/FormComponents'
import { useToast } from '@/components/ui/ToastProvider'
import { useAuthStore } from '@/store/useAuthStore'
import { useOrgStore } from '@/store/useOrgStore'

const loginSchema = yup.object().shape({
  email: yup.string().email('Invalid email address').required('Email is required'),
  password: yup.string().min(8, 'Password must be at least 8 characters').required('Password is required'),
  rememberMe: yup.boolean().default(false),
})

type LoginFormData = yup.InferType<typeof loginSchema>

export type LoginHighlight = {
  title: string
  description: string
}

export type LoginBranding = {
  siteName: string
  tagline?: string | null
  heroTitle: string
  heroSubtitle: string
  highlights: LoginHighlight[]
  logoUrl?: string | null
  companyName?: string | null
  companyAddress?: string | null
}

interface LoginClientProps {
  branding: LoginBranding
}

export default function LoginClient({ branding }: LoginClientProps) {
  const router = useRouter()
  const { login } = useAuthStore()
  const { updateOrg } = useOrgStore()
  const { showToast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const isSubmittingRef = useRef(false)

  useEffect(() => {
    router.prefetch('/dashboard')
    router.prefetch('/employees')
  }, [router])

  useEffect(() => {
    updateOrg({
      siteName: branding.siteName,
      tagline: branding.tagline ?? '',
      companyName: branding.companyName ?? '',
      companyAddress: branding.companyAddress ?? '',
      logoUrl: branding.logoUrl ?? null,
    })
  }, [branding, updateOrg])

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginFormData>({
    resolver: yupResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
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
      await login(data.email, data.password, { rememberMe: data.rememberMe })
      showToast('Successfully logged in', 'success')

      const role = useAuthStore.getState().user?.role
      const isAdminRole = typeof role === 'string' && role.toLowerCase().includes('admin')
      router.replace(isAdminRole ? '/dashboard' : '/employees')
      return
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to login'
      showToast(message, 'error')
      setIsLoading(false)
      isSubmittingRef.current = false
    }
  }

  return (
    <div className="relative min-h-screen bg-slate-950 text-white flex flex-col lg:flex-row overflow-hidden">
      {/* Left hero */}
      <div className="relative flex-1 flex items-center justify-center overflow-hidden px-8 py-12">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 opacity-70"></div>
        <div className="absolute inset-0">
          <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-white/10 blur-3xl"></div>
          <div className="absolute bottom-0 left-10 h-48 w-48 rounded-full bg-indigo-300/30 blur-3xl"></div>
        </div>

        <div className="relative z-10 max-w-xl space-y-8">
          <div className="flex items-center space-x-3">
            {branding.logoUrl ? (
              <Image
                src={branding.logoUrl}
                alt={`${branding.siteName} logo`}
                width={72}
                height={72}
                className="h-16 w-16 rounded-2xl bg-white/10 object-contain shadow-2xl ring-2 ring-white/30"
                priority
              />
            ) : (
              <div className="h-16 w-16 rounded-2xl bg-white/15 flex items-center justify-center shadow-2xl ring-2 ring-white/30">
                <span className="text-2xl font-semibold tracking-tight">{monogram}</span>
              </div>
            )}
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-white/70">{branding.siteName || 'HR Portal'}</p>
              <h1 className="text-4xl font-semibold leading-tight">{branding.heroTitle}</h1>
            </div>
          </div>

          <p className="text-lg text-white/80">{branding.heroSubtitle || branding.tagline}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {branding.highlights?.map((highlight) => (
              <div
                key={highlight.title}
                className="bg-white/10 backdrop-blur border border-white/10 rounded-2xl p-4 shadow-lg hover:bg-white/15 transition-colors"
              >
                <p className="text-sm uppercase tracking-wide text-white/70">{highlight.title}</p>
                <p className="text-base font-medium">{highlight.description}</p>
              </div>
            ))}
          </div>

          {branding.companyName && (
            <div className="text-sm text-white/50">
              <p className="font-semibold text-white/70">{branding.companyName}</p>
              <p>{branding.companyAddress}</p>
            </div>
          )}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 bg-gray-50 flex items-center justify-center px-6 py-12 sm:px-12">
        <div className="w-full max-w-md space-y-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Sign in</h2>
            <p className="mt-2 text-sm text-gray-600">
              Access workforce data, approvals, and insights tailored for your role.
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
              <Input
                label="Work email"
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

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center space-x-2 text-gray-700">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    id="remember-me"
                    {...register('rememberMe')}
                  />
                  <span>Keep me signed in</span>
                </label>

                <Link href="/auth/request-password-reset" className="font-medium text-blue-600 hover:text-blue-500">
                  Forgot password?
                </Link>
              </div>

              <Button type="submit" variant="primary" className="w-full justify-center" disabled={isLoading}>
                {isLoading ? 'Logging in…' : 'Sign in'}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-500">
              Need access?{' '}
              <Link href="/auth/invite" className="font-medium text-blue-600 hover:text-blue-500">
                Contact your HR partner
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
