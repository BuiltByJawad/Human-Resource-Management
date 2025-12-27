import { LeaveRequestsPageClient } from './LeaveRequestsPageClient'
import { LeaveRequest } from '@/components/hrm/LeaveComponents'

import { cookies } from 'next/headers'

function buildApiBase() {
  return (
    process.env.BACKEND_URL ||
    (process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api$/, '') : null) ||
    'http://localhost:5000'
  )
}

async function fetchInitialPending(token: string | null): Promise<LeaveRequest[]> {
  try {
    if (!token) return []
    const base = buildApiBase()

    const url = new URL(`${base}/api/leave`)
    url.searchParams.set('status', 'pending')

    const response = await fetch(url.toString(), {
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

export default async function LeaveRequestsPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('accessToken')?.value ?? null
  const initialRequests = await fetchInitialPending(token)
  return <LeaveRequestsPageClient initialRequests={initialRequests} />
}
