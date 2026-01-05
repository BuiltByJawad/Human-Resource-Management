import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import type { ExpenseClaim } from '@/features/expenses'
import { ExpensesPageClient } from './ExpensesPageClient'
import { fetchCurrentUser } from '@/features/auth/services/auth.api'
import { getMyExpenses } from '@/features/expenses'

export default async function MyExpensesPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('accessToken')?.value ?? null
  const user = await fetchCurrentUser(token ?? undefined)
  const employeeId = user?.employee?.id ?? null
  if (!employeeId) {
    redirect('/dashboard')
  }
  const initialClaims = employeeId && token ? await getMyExpenses(employeeId, token ?? undefined) : []

  return <ExpensesPageClient employeeId={employeeId} initialClaims={initialClaims} />
}
