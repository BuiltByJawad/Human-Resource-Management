import { redirect } from 'next/navigation'

import { getServerAuthContext } from '@/lib/auth/serverAuth'
import { fetchMyCoursesServer } from '@/services/training/api'
import { TrainingPageClient } from './TrainingPageClient'

export default async function TrainingDashboard() {
  const { user, token } = await getServerAuthContext()
  const employeeId = user?.employee?.id ?? null
  if (!employeeId) {
    redirect('/dashboard')
  }

  const initialCourses = await fetchMyCoursesServer(token)
  return <TrainingPageClient initialCourses={initialCourses} />
}
