"use client"

import { useMemo } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"

import DashboardShell from "@/components/ui/DashboardShell"
import { useAuthStore } from "@/store/useAuthStore"
import { useToast } from "@/components/ui/ToastProvider"
import { handleCrudError } from "@/lib/apiError"
import { fetchPendingExpenses, updateExpenseStatus } from "@/services/expenses/api"
import type { ExpenseClaim, UpdateExpenseStatusPayload } from "@/services/expenses/types"
import { format } from "date-fns"

interface ExpensesAdminPageClientProps {
  initialClaims: ExpenseClaim[]
  initialCanApprove: boolean
}

export function ExpensesAdminPageClient({ initialClaims, initialCanApprove }: ExpensesAdminPageClientProps) {
  const { user } = useAuthStore()
  const { showToast } = useToast()
  const queryClient = useQueryClient()

  const canApproveFromStore = useMemo(
    () => user?.permissions?.includes("expenses.approve") ?? false,
    [user?.permissions],
  )
  const canApprove = canApproveFromStore || initialCanApprove

  const claimsQuery = useQuery({
    queryKey: ["expenses", "pending"],
    queryFn: () => fetchPendingExpenses(),
    initialData: initialClaims,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  })

  const handleStatus = async (id: string, status: UpdateExpenseStatusPayload["status"], rejectionReason?: string) => {
    try {
      await updateExpenseStatus(id, { status, rejectionReason })
      showToast(`Claim ${status}`, "success")
      queryClient.invalidateQueries({ queryKey: ["expenses", "pending"] })
    } catch (error: unknown) {
      handleCrudError({
        error,
        resourceLabel: "Expense claim",
        showToast,
      })
    }
  }

  const claims = claimsQuery.data ?? []
  const isLoading = claimsQuery.isLoading

  return (
    <DashboardShell>
      <div className="p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Expense Approvals</h1>
              <p className="text-sm text-gray-600">Review and approve incoming claims.</p>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-100 shadow p-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Pending Claims</h2>
            {isLoading ? (
              <p className="text-sm text-gray-500">Loading...</p>
            ) : claims.length === 0 ? (
              <p className="text-sm text-gray-500">No pending claims.</p>
            ) : (
              <div className="space-y-3">
                {claims.map((claim) => (
                  <div key={claim.id} className="border rounded-lg p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <p className="text-base font-semibold text-gray-900">
                          ${claim.amount.toFixed(2)} · {claim.category}
                        </p>
                        <p className="text-sm text-gray-600">{claim.description || "No description provided"}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Submitted {format(new Date(claim.date), "PP")} {claim.currency}
                        </p>
                      </div>
                      {canApprove && (
                        <div className="flex gap-2">
                          <button
                            className="px-3 py-1.5 text-xs rounded bg-emerald-600 text-white"
                            onClick={() => handleStatus(claim.id, "approved")}
                          >
                            Approve
                          </button>
                          <button
                            className="px-3 py-1.5 text-xs rounded bg-red-600 text-white"
                            onClick={() => {
                              const reason = prompt("Reason for rejection?")
                              if (reason) handleStatus(claim.id, "rejected", reason)
                            }}
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                    {claim.receiptUrl && (
                      <a
                        href={claim.receiptUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-blue-600 underline mt-2 inline-block"
                      >
                        View receipt
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}
