import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { OffboardingPageClient } from './OffboardingPageClient'
import type { OffboardingProcess } from '@/services/offboardingService'

function buildApiBase() {
  return (
    process.env.BACKEND_URL ||
    (process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api$/, '') : null) ||
    'http://localhost:5000'
  )
}

async function fetchCurrentUser() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('accessToken')?.value
    if (!token) {
      return { user: null, token: null }
    }

    const response = await fetch(`${buildApiBase()}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`
      },
      cache: 'no-store'
    })

    if (!response.ok) {
      return { user: null, token: null }
    }

    const payload = await response.json().catch(() => null)
    const data = payload?.data ?? payload
    return { user: data?.user ?? data ?? null, token }
  } catch {
    return { user: null, token: null }
  }
}

async function fetchInitialOffboarding(employeeId: string | null, token: string | null): Promise<OffboardingProcess | null> {
  if (!employeeId || !token) {
    return null
  }

  try {
    const response = await fetch(`${buildApiBase()}/api/offboarding/${employeeId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      cache: 'no-store'
    })

    if (!response.ok) {
      return null
    }

    const payload = await response.json().catch(() => null)
    const data = payload?.data ?? payload
    if (!data || typeof data !== 'object') {
      return null
    }
    return data as OffboardingProcess
  } catch {
    return null
  }
}

export default async function MyOffboardingPage() {
  const { user, token } = await fetchCurrentUser()
  const employeeId = user?.employee?.id ?? null
  if (!employeeId) {
    redirect('/dashboard')
  }
  const initialProcess = await fetchInitialOffboarding(employeeId, token)

  return <OffboardingPageClient employeeId={employeeId} initialProcess={initialProcess} />
}
