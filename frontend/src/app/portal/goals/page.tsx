import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import type { PerformanceGoal } from '@/features/goals'
import { GoalsPageClient } from './GoalsPageClient'
import { fetchCurrentUser } from '@/features/auth/services/auth.api'
import { getMyGoals } from '@/features/goals'

export default async function GoalsPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('accessToken')?.value ?? null
  const user = await fetchCurrentUser(token ?? undefined)
  const employeeId = user?.employee?.id ?? null
  if (!employeeId) {
    redirect('/dashboard')
  }

  const initialGoals: PerformanceGoal[] = token ? await getMyGoals(token ?? undefined) : []
  return <GoalsPageClient initialGoals={initialGoals} />
}
