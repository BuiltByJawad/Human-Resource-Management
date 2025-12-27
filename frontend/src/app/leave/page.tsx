import { LeavePageClient } from './LeavePageClient'
import { LeaveRequest } from '@/components/hrm/LeaveComponents'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

function buildApiBase() {
  return (
    process.env.BACKEND_URL ||
    (process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api$/, '') : null) ||
    'http://localhost:5000'
  )
}

async function fetchCurrentUser(token: string | null) {
  if (!token) return null
  try {
    const response = await fetch(`${buildApiBase()}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
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

async function fetchInitialLeave(token: string | null): Promise<LeaveRequest[]> {
  try {
    if (!token) return []
    const base = buildApiBase()

    const response = await fetch(`${base}/api/leave`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store'
    })

    if (!response.ok) {
      return []
    }

    const payload = await response.json().catch(() => null)
    const data = payload?.data ?? payload
    if (!Array.isArray(data)) return []
    return data
  } catch {
    return []
  }
}

export default async function LeavePage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('accessToken')?.value ?? null
  const user = await fetchCurrentUser(token)
  const employeeId = user?.employee?.id ?? null
  if (!employeeId) {
    redirect('/dashboard')
  }

  const initialRequests = await fetchInitialLeave(token)
  return <LeavePageClient initialRequests={initialRequests} />
}
