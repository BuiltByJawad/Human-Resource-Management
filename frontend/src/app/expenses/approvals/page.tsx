import { ExpensesAdminPageClient } from "../ExpensesAdminPageClient"
import { getServerAuthContext } from "@/lib/auth/serverAuth"
import { fetchPendingExpensesServer } from "@/services/expenses/api"

export default async function ExpenseApprovalsPage() {
  const { user, token } = await getServerAuthContext()
  const permissions: string[] = Array.isArray(user?.permissions) ? user!.permissions : []
  const canApprove = permissions.includes("expenses.approve")

  const initialClaims = await fetchPendingExpensesServer(token)

  return <ExpensesAdminPageClient initialClaims={initialClaims} initialCanApprove={canApprove} />
}
