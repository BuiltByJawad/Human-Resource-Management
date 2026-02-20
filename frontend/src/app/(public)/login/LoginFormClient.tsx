'use client'

import Link from 'next/link'

import { Button, Input } from '@/components/ui/FormComponents'
import { useLoginClient } from '@/hooks/useLoginClient'
import type { LoginBranding } from '@/services/login/types'

interface LoginFormClientProps {
  branding: LoginBranding
}

export default function LoginFormClient({ branding }: LoginFormClientProps) {
  const { register, handleSubmit, errors, isLoading, monogram, isMfaStep, onSubmit } = useLoginClient(branding)

  return (
    <div className="flex-1 bg-slate-50 flex items-center justify-center px-6 py-12 sm:px-12">
      <div className="w-full max-w-md space-y-8">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center text-sm font-semibold">
              {monogram}
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.32em] text-slate-400">Secure Access</p>
              <p className="text-sm font-semibold text-slate-900">{branding.siteName || 'HR Workspace'}</p>
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-semibold text-slate-900">Welcome back</h2>
            <p className="text-sm text-slate-500">
              Sign in to manage workforce insights, approvals, and HR operations.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8 border border-slate-200">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-4">
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

              {isMfaStep && (
                <Input
                  label="Authentication code"
                  type="text"
                  placeholder="123456"
                  required
                  showRequiredIndicator={false}
                  error={errors.mfaCode?.message}
                  {...register('mfaCode')}
                />
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 text-sm">
              <label className="flex items-center space-x-2 text-slate-600">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                  id="remember-me"
                  {...register('rememberMe')}
                />
                <span>Keep me signed in</span>
              </label>

              <Link href="/auth/request-password-reset" className="font-medium text-slate-900 hover:text-slate-700">
                Forgot password?
              </Link>
            </div>

            <Button type="submit" variant="primary" className="w-full justify-center" disabled={isLoading}>
              {isLoading
                ? isMfaStep
                  ? 'Verifying…'
                  : 'Logging in…'
                : isMfaStep
                  ? 'Verify code'
                  : 'Sign in'}
            </Button>
          </form>

          <div className="mt-6 border-t border-slate-200 pt-5 text-center text-sm text-slate-500">
            <p className="text-xs uppercase tracking-[0.32em] text-slate-400">Need access?</p>
            <Link href="/auth/invite" className="font-semibold text-slate-900 hover:text-slate-700">
              Contact your HR partner
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
