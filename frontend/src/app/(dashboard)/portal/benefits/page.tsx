import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { BenefitsPageClient } from './BenefitsPageClient'
import type { BenefitsResponse } from '@/services/benefits/types'

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
    if (!token) return null

    const response = await fetch(`${buildApiBase()}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`
      },
      cache: 'no-store'
    })

    if (!response.ok) {
      return null
    }

    const payload = await response.json().catch(() => null)
    const data = payload?.data ?? payload
    return data?.user ?? data ?? null
  } catch {
    return null
  }
}

async function fetchInitialBenefits(employeeId: string | null, token: string | null): Promise<BenefitsResponse> {
  if (!employeeId || !token) {
    return { benefits: [], summary: null }
  }

  try {
    const response = await fetch(`${buildApiBase()}/api/benefits/employee/${employeeId}`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store'
    })

    if (!response.ok) {
      return { benefits: [], summary: null }
    }

    const payload = await response.json().catch(() => null)
    const data = payload?.data ?? payload
    if (!data || typeof data !== 'object') {
      return { benefits: [], summary: null }
    }
    return {
      benefits: Array.isArray(data.benefits) ? data.benefits : [],
      summary: data.summary ?? null
    }
  } catch {
    return { benefits: [], summary: null }
  }
}

export default async function MyBenefitsPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('accessToken')?.value ?? null
  const user = await fetchCurrentUser()
  const employeeId = user?.employee?.id ?? null
  if (!employeeId) {
    redirect('/dashboard')
  }
  const initialBenefits = await fetchInitialBenefits(employeeId, token)

  return <BenefitsPageClient employeeId={employeeId} initialBenefits={initialBenefits} />
}
