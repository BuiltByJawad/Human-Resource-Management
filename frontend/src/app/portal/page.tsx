import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { PortalDashboardClient } from './PortalDashboardClient'
import { DEFAULT_PORTAL_MODULES } from './modules'
import { fetchCurrentUser } from '@/features/auth/services/auth.api'

export const dynamic = 'force-dynamic'

export default async function PortalDashboardPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('accessToken')?.value ?? null
  const user = await fetchCurrentUser(token ?? undefined)
  const employeeId = user?.employee?.id ?? null
  if (!employeeId) {
    redirect('/dashboard')
  }

  return <PortalDashboardClient modules={DEFAULT_PORTAL_MODULES} />
}
