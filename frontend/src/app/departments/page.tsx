export const dynamic = 'force-dynamic'

import { cookies } from 'next/headers'

import { DepartmentsPageClient } from './DepartmentsPageClient'
import { fetchDepartments } from '@/features/departments'
import { fetchEmployeesForManagers } from '@/features/employees'

export default async function DepartmentsPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('accessToken')?.value ?? null

  const [initialDepartments, initialEmployees] = await Promise.all([
    fetchDepartments(token ?? undefined),
    fetchEmployeesForManagers(token ?? undefined),
  ])

  return (
    <DepartmentsPageClient
      initialDepartments={initialDepartments}
      initialEmployees={initialEmployees}
    />
  )
}