"use client"

import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import api from '@/app/api/api'
import { useAuthStore } from '@/store/useAuthStore'
import { PasswordStrengthBar } from '@/components/ui/PasswordStrengthBar'

import { Suspense } from 'react'

const inviteSchema = yup.object().shape({
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

type InviteForm = yup.InferType<typeof inviteSchema>

function AcceptInviteContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token') || ''
  const login = useAuthStore((state) => state.login)
  const [serverError, setServerError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<InviteForm>({
    resolver: yupResolver(inviteSchema),
    defaultValues: {
      password: '',
      confirmPassword: ''
    }
  })

  const inviteValid = useMemo(() => Boolean(token && token.length > 0), [token])
  const passwordValue = watch('password', '')

  const onSubmit = async (data: InviteForm) => {
    if (!inviteValid) {
      return
    }

    setServerError('')
    setIsSubmitting(true)

    try {
      const response = await api.post('/auth/complete-invite', {
        token,
        password: data.password
      })

      const email = response.data?.data?.email
      if (!email) {
        throw new Error('Invite completed but no email was returned from server')
      }

      await login(email, data.password)
      router.push('/dashboard')
    } catch (error: any) {
      console.error('Failed to complete invite', error)
      const message =
        error?.response?.data?.error?.message ||
        error?.response?.data?.message ||
        error?.message ||
        'Failed to accept invite'
      setServerError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!inviteValid) {
    return (
      <section className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white shadow-lg rounded-2xl p-8">
          <h1 className="text-2xl font-semibold text-gray-900">Invalid invite link</h1>
          <p className="mt-3 text-gray-600">
            This invite link is missing or malformed. Please use the link provided in your email or ask an administrator to
            resend the invitation.
          </p>
          <Link href="/login" className="mt-6 inline-flex text-sm font-medium text-blue-600 hover:text-blue-700">
            Back to login
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white shadow-xl rounded-2xl p-8 border border-gray-100">
        <div className="mb-6 text-center space-y-2">
          <h1 className="text-2xl font-semibold text-gray-900">Set your password</h1>
          <p className="text-sm text-gray-600">Choose a password to activate your HRM account.</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.password ? 'border-red-400' : 'border-gray-300'
                }`}
              placeholder="Create a password"
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
            {isSubmitting ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <div className="text-center text-sm text-gray-500 mt-4">
          Already have access?
          <Link href="/login" className="ml-1 font-medium text-blue-600 hover:text-blue-700">
            Go to login
          </Link>
        </div>
      </div>
    </section>
  )
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AcceptInviteContent />
    </Suspense>
  )
}
