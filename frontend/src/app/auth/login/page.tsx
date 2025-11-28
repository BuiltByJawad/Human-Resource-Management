"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AuthLoginRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/login')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <p className="text-sm text-gray-600">Redirecting to login...</p>
    </div>
  )
}