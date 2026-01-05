import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { TrainingPageClient } from './TrainingPageClient'
import type { EmployeeTraining } from '@/features/training'
import { fetchCurrentUser } from '@/features/auth/services/auth.api'
import { getMyCourses } from '@/features/training'

export default async function TrainingDashboard() {
  const cookieStore = await cookies()
  const token = cookieStore.get('accessToken')?.value ?? null
  const user = await fetchCurrentUser(token ?? undefined)
  const employeeId = user?.employee?.id ?? null
  if (!employeeId) {
    redirect('/dashboard')
  }

  const modules = token ? await getMyCourses(token ?? undefined) : []
  return <TrainingPageClient initialCourses={modules} />
}
