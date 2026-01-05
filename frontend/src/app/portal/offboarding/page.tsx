import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { OffboardingPageClient } from './OffboardingPageClient'
import type { OffboardingProcess } from '@/features/offboarding'
import { fetchCurrentUser } from '@/features/auth/services/auth.api'
import { getEmployeeOffboarding } from '@/features/offboarding'

export default async function MyOffboardingPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('accessToken')?.value ?? null
  const user = await fetchCurrentUser(token ?? undefined)
  const employeeId = user?.employee?.id ?? null
  if (!employeeId) {
    redirect('/dashboard')
  }
  const initialProcess = employeeId && token ? await getEmployeeOffboarding(employeeId, token ?? undefined) : null

  return <OffboardingPageClient employeeId={employeeId} initialProcess={initialProcess} />
}
