import { redirect } from 'next/navigation'

import { getServerAuthContext } from '@/lib/auth/serverAuth'
import { fetchMyExpensesServer } from '@/services/expenses/api'
import { ExpensesPageClient } from './ExpensesPageClient'

export default async function MyExpensesPage() {
  const { user, token } = await getServerAuthContext()
  const employeeId = user?.employee?.id ?? null
  if (!employeeId) {
    redirect('/dashboard')
  }
  const initialClaims = await fetchMyExpensesServer(employeeId, token)

  return <ExpensesPageClient employeeId={employeeId} initialClaims={initialClaims} />
}
