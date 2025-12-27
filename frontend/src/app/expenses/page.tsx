import { cookies } from "next/headers"

import { ExpensesAdminPageClient } from "./ExpensesAdminPageClient"
import type { ExpenseClaim } from "@/services/expenseService"

function buildApiBase() {
  return (
    process.env.BACKEND_URL ||
    (process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api$/, "") : null) ||
    "http://localhost:5000"
  )
}

async function fetchWithToken<T = any>(
  path: string,
  token: string | null,
  params?: URLSearchParams,
): Promise<T | null> {
  if (!token) return null
  try {
    const base = buildApiBase()
    const url = params ? `${base}${path}?${params.toString()}` : `${base}${path}`
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    })
    if (!response.ok) {
      return null
    }
    const payload = await response.json().catch(() => null)
    return (payload?.data ?? payload ?? null) as T | null
  } catch {
    return null
  }
}

async function fetchCurrentUser(token: string | null) {
  const data = (await fetchWithToken(`/api/auth/me`, token)) as any
  if (!data) return null
  return data?.user ?? data ?? null
}

async function fetchPendingExpenses(token: string | null): Promise<ExpenseClaim[]> {
  const data = (await fetchWithToken<ExpenseClaim[] | { data?: ExpenseClaim[] }>(`/api/expenses/pending`, token)) ?? []
  if (Array.isArray(data)) return data
  if (Array.isArray((data as any)?.data)) return (data as any).data
  return []
}

export default async function ExpensesAdminPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get("accessToken")?.value ?? null

  const user = await fetchCurrentUser(token)
  const permissions: string[] = Array.isArray(user?.permissions) ? user!.permissions : []
  const canApprove = permissions.includes("expenses.approve")

  const initialClaims = await fetchPendingExpenses(token)

  return <ExpensesAdminPageClient initialClaims={initialClaims} initialCanApprove={canApprove} />
}
