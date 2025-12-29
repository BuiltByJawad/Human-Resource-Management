import { cookies } from 'next/headers'

import { EmployeesPageClient } from './EmployeesPageClient'
import { fetchDepartments, fetchRolesWithToken, fetchEmployees } from '@/lib/hrmData'

export default async function EmployeesPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('accessToken')?.value ?? null

  const [departments, roles, employees] = await Promise.all([
    fetchDepartments(token ?? undefined),
    fetchRolesWithToken(token ?? undefined),
    fetchEmployees({ page: 1, limit: 9 }, token ?? undefined),
  ])

  return (
    <EmployeesPageClient
      initialDepartments={departments}
      initialRoles={roles}
      initialEmployees={employees}
    />
  )
}
