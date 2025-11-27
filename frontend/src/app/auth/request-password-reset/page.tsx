"use client"

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import api from '@/app/api/api'

const requestSchema = yup.object().shape({
  email: yup.string().email('Enter a valid email').required('Email is required')
})

type RequestForm = yup.InferType<typeof requestSchema>

export default function RequestPasswordResetPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [serverError, setServerError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<RequestForm>({
    resolver: yupResolver(requestSchema),
    defaultValues: { email: '' }
  })

  const onSubmit = async (data: RequestForm) => {
    setServerError('')
    setSuccessMessage(null)
    setIsSubmitting(true)

    try {
      const response = await api.post('/auth/password-reset/request', { email: data.email })
      const message = response.data?.message || 'If this email exists, a reset link will be sent shortly.'
      setSuccessMessage(message)
    } catch (error: any) {
      const message = error.response?.data?.message || 'Unable to process reset request'
      setServerError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="max-w-md w-full space-y-8 bg-white shadow-xl rounded-2xl p-8 border border-gray-100">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-semibold text-gray-900">Reset your password</h1>
          <p className="text-sm text-gray-600">
            Enter your email and we&apos;ll send a secure link to set a new password.
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
            <input
              type="email"
              className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.email ? 'border-red-400' : 'border-gray-300'
              }`}
              placeholder="you@example.com"
              {...register('email')}
            />
            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
          </div>

          {serverError && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{serverError}</div>
          )}

          {successMessage && (
            <div className="rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-700">{successMessage}</div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full inline-flex justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
          >
            {isSubmitting ? 'Sending link...' : 'Send reset link'}
          </button>
        </form>

        <div className="text-center text-sm text-gray-500">
          Remembered your password?
          <Link href="/auth/login" className="ml-1 font-medium text-blue-600 hover:text-blue-700">
            Go back to login
          </Link>
        </div>
      </div>
    </section>
  )
}
