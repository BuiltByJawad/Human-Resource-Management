'use client'

import Link from 'next/link'

import { Button, Input } from '@/components/ui/FormComponents'
import { LoginHero } from '@/components/features/login'
import { useLoginClient } from '@/hooks/useLoginClient'
import type { LoginBranding } from '@/services/login/types'

interface LoginClientProps {
  branding: LoginBranding
}

export default function LoginClient({ branding }: LoginClientProps) {
  const { register, handleSubmit, errors, isLoading, monogram, onSubmit } = useLoginClient(branding)

  return (
    <div className="relative min-h-screen bg-slate-950 text-white flex flex-col lg:flex-row overflow-hidden">
      {/* Left hero */}
      <LoginHero branding={branding} monogram={monogram} />

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
                label="Work Email"
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
