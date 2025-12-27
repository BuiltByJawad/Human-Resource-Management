import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import type { ExpenseClaim } from '@/services/expenseService'
import { ExpensesPageClient } from './ExpensesPageClient'

function buildApiBase() {
  return (
    process.env.BACKEND_URL ||
    (process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api$/, '') : null) ||
    'http://localhost:5000'
  )
}

async function fetchCurrentUser() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('accessToken')?.value
    if (!token) return { user: null, token: null }

    const response = await fetch(`${buildApiBase()}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`
      },
      cache: 'no-store'
    })

    if (!response.ok) {
      return { user: null, token: null }
    }

    const payload = await response.json().catch(() => null)
    const data = payload?.data ?? payload
    const user = data?.user ?? data ?? null
    return { user, token }
  } catch {
    return { user: null, token: null }
  }
}

async function fetchInitialExpenses(employeeId: string | null, token: string | null): Promise<ExpenseClaim[]> {
  if (!employeeId || !token) {
    return []
  }

  try {
    const response = await fetch(`${buildApiBase()}/api/expenses/my/${employeeId}`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      cache: 'no-store'
    })

    if (!response.ok) {
      return []
    }

    const payload = await response.json().catch(() => null)
    const data = payload?.data ?? payload
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

export default async function MyExpensesPage() {
  const { user, token } = await fetchCurrentUser()
  const employeeId = user?.employee?.id ?? null
  if (!employeeId) {
    redirect('/dashboard')
  }
  const initialClaims = await fetchInitialExpenses(employeeId, token)

  return <ExpensesPageClient employeeId={employeeId} initialClaims={initialClaims} />
}
