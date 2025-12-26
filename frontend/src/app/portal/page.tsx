import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { PortalDashboardClient } from './PortalDashboardClient'
import { DEFAULT_PORTAL_MODULES } from './modules'

export const dynamic = 'force-dynamic'

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

export default async function PortalDashboardPage() {
  const user = await fetchCurrentUser()
  const employeeId = user?.employee?.id ?? null
  if (!employeeId) {
    redirect('/dashboard')
  }
  // Placeholder for future server-side fetch (e.g., user-specific modules)
  const modules = DEFAULT_PORTAL_MODULES

  return <PortalDashboardClient modules={modules} />
}
