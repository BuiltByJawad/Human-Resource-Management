import { cookies } from "next/headers"

import { ExpensesAdminPageClient } from "../ExpensesAdminPageClient"
import { fetchPendingExpenses } from "@/features/expenses"
import { fetchCurrentUser } from "@/features/auth/services/auth.api"

export default async function ExpenseApprovalsPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get("accessToken")?.value ?? null

  const user = await fetchCurrentUser(token ?? undefined)
  const permissions: string[] = Array.isArray(user?.permissions) ? user!.permissions : []
  const canApprove = permissions.includes("expenses.approve")

  const initialClaims = await fetchPendingExpenses(token ?? undefined)

  return <ExpensesAdminPageClient initialClaims={initialClaims} initialCanApprove={canApprove} />
}
