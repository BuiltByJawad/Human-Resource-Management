"use client"

import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import api from '@/lib/axios'
import { PasswordStrengthBar } from '@/components/ui/PasswordStrengthBar'

import { Suspense } from 'react'

const resetSchema = yup.object().shape({
  password: yup
    .string()
    .required('Password is required')
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
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'Passwords must match')
    .required('Please confirm your password')
})

type ResetForm = yup.InferType<typeof resetSchema>

function ResetPasswordContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token') || ''
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [serverError, setServerError] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<ResetForm>({
    resolver: yupResolver(resetSchema),
    defaultValues: {
      password: '',
      confirmPassword: ''
    }
  })

  const tokenValid = useMemo(() => Boolean(token && token.length > 0), [token])
  const passwordValue = watch('password', '')

  const onSubmit = async (data: ResetForm) => {
    if (!tokenValid) {
      return
    }

    setServerError('')
    setIsSubmitting(true)

    try {
      await api.post('/auth/password/reset', {
        token,
        password: data.password
      })
      setIsSuccess(true)
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to reset password'
      setServerError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!tokenValid && !isSuccess) {
    return (
      <section className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
        <div className="max-w-md w-full bg-white shadow-lg rounded-2xl p-8">
          <h1 className="text-2xl font-semibold text-gray-900">Invalid reset link</h1>
          <p className="mt-3 text-gray-600">
            This reset link is missing or malformed. Please use the latest link sent to your email or request another reset.
          </p>
          <Link href="/auth/request-password-reset" className="mt-6 inline-flex text-sm font-medium text-blue-600 hover:text-blue-700">
            Request a new link
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="max-w-md w-full bg-white shadow-xl rounded-2xl p-8 border border-gray-100">
        {isSuccess ? (
          <div className="text-center space-y-6">
            <h1 className="text-2xl font-semibold text-gray-900">Password updated</h1>
            <p className="text-gray-600">Your password has been reset successfully. You can now log in with your new credentials.</p>
            <button
              onClick={() => router.push('/login')}
              className="w-full inline-flex justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Go to login
            </button>
          </div>
        ) : (
          <>
            <div className="mb-6 text-center space-y-2">
              <h1 className="text-2xl font-semibold text-gray-900">Set a new password</h1>
              <p className="text-sm text-gray-600">Choose a strong password that you haven&apos;t used before on this site.</p>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New password</label>
                <input
                  type="password"
                  className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.password ? 'border-red-400' : 'border-gray-300'
                    }`}
                  placeholder="Enter new password"
                  {...register('password')}
                />
                {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
                <PasswordStrengthBar password={passwordValue} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm password</label>
                <input
                  type="password"
                  className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.confirmPassword ? 'border-red-400' : 'border-gray-300'
                    }`}
                  placeholder="Re-enter password"
                  {...register('confirmPassword')}
                />
                {errors.confirmPassword && <p className="mt-1 text-xs text-red-600">{errors.confirmPassword.message}</p>}
              </div>

              {serverError && (
                <div className="rounded-lg bg-red-50 border border-red-100 px-3 py-2 text-sm text-red-700">{serverError}</div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full inline-flex justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
              >
                {isSubmitting ? 'Updating...' : 'Reset password'}
              </button>
            </form>

            <div className="text-center text-sm text-gray-500 mt-4">
              Didn&apos;t request this reset?
              <Link href="/login" className="ml-1 font-medium text-blue-600 hover:text-blue-700">
                Return to login
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordContent />
    </Suspense>
  )
}
