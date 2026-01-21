import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { OffboardingPageClient } from './OffboardingPageClient'
import { fetchOffboardingCurrentUser, fetchOffboardingEmployeeProcess } from '@/services/offboarding/api'

export default async function MyOffboardingPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('accessToken')?.value ?? null
  const user = await fetchOffboardingCurrentUser(token)
  const employeeId = user?.employee?.id ?? null
  if (!employeeId) {
    redirect('/dashboard')
  }
  const initialProcess = await fetchOffboardingEmployeeProcess(employeeId, token)

  return <OffboardingPageClient employeeId={employeeId} initialProcess={initialProcess} />
}
