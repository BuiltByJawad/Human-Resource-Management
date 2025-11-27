"use client"

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/store/useAuthStore'
import { Button, Input } from '@/components/ui/FormComponents'
import { useToast } from '@/components/ui/ToastProvider'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'

const loginSchema = yup.object().shape({
  email: yup.string().email('Invalid email address').required('Email is required'),
  password: yup.string().required('Password is required'),
})

type LoginFormData = yup.InferType<typeof loginSchema>

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { login } = useAuthStore()
  const { showToast } = useToast()
  const isSubmittingRef = useRef(false)

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: yupResolver(loginSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  })

  const onSubmit = async (data: LoginFormData) => {
    if (isSubmittingRef.current) return
    isSubmittingRef.current = true
    setIsLoading(true)

    try {
      await login(data.email, data.password)
      showToast('Successfully logged in', 'success')
      router.push('/employees')
    } catch (error: any) {
      showToast(error.message || 'Failed to login', 'error')
    } finally {
      setIsLoading(false)
      isSubmittingRef.current = false
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-xl">N</span>
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Or{' '}
          <a href="#" className="font-medium text-blue-600 hover:text-blue-500">
            contact your administrator
          </a>
        </p>
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
              <Button
                type="submit"
                variant="primary"
                className="w-full justify-center"
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
