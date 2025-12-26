import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { ShiftsPageClient } from './ShiftsPageClient'
import type { Shift } from '@/services/shiftService'

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
    if (!token) return { user: null, token: null }

    const response = await fetch(`${buildApiBase()}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      return { user: null, token: null }
    }

    const payload = await response.json().catch(() => null)
    const data = payload?.data ?? payload
    const user = data?.user ?? data ?? null
    return { user, token }
  } catch {
    return { user: null, token: null }
  }
}

async function fetchInitialShifts(date: Date, token: string | null): Promise<Shift[]> {
  try {
    if (!token) return []
    const base = buildApiBase()
    const params = new URLSearchParams({
      startDate: date.toISOString(),
      endDate: date.toISOString()
    })
    const response = await fetch(`${base}/api/shifts?${params.toString()}`, {
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
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

export default async function ShiftsPage() {
  const { user, token } = await fetchCurrentUser()
  const employeeId = user?.employee?.id ?? null
  if (!employeeId) {
    redirect('/dashboard')
  }
  const today = new Date()
  const initialShifts = await fetchInitialShifts(today, token)

  return <ShiftsPageClient initialShifts={initialShifts} initialDateISO={today.toISOString()} />
}
