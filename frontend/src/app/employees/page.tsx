import { cookies } from 'next/headers'

import { EmployeesPageClient } from './EmployeesPageClient'
import { fetchDepartments } from '@/features/departments'
import { fetchRoles } from '@/features/roles'
import { fetchEmployees } from '@/features/employees'

export default async function EmployeesPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('accessToken')?.value ?? null

  const [departments, roles, employees] = await Promise.all([
    fetchDepartments(token ?? undefined),
    fetchRoles(token ?? undefined),
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
