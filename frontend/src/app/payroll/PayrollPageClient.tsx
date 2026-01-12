"use client"

import { useEffect, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  AdjustmentsHorizontalIcon,
  BanknotesIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline"

import { DataTable, type Column } from "@/components/ui/DataTable"
import { PayslipModal } from "@/components/hrm/PayslipModal"
import GeneratePayrollModal from "@/components/hrm/GeneratePayrollModal"
import ExportPayrollModal from "@/components/hrm/ExportPayrollModal"
import PayrollConfigModal from "@/components/hrm/PayrollConfigModal"
import Sidebar from "@/components/ui/Sidebar"
import Header from "@/components/ui/Header"
import { useAuthStore } from "@/store/useAuthStore"
import { useToast } from "@/components/ui/ToastProvider"
import { handleCrudError } from "@/lib/apiError"
import {
  deletePayrollOverride,
  downloadPayrollPeriodCsv,
  fetchPayrollConfig,
  fetchPayrollOverride,
  fetchPayrollRecords,
  generatePayroll,
  upsertPayrollOverride,
  updatePayrollConfig,
  updatePayrollStatus,
} from "@/lib/hrmData"
import { PERMISSIONS } from "@/constants/permissions"

import { PayrollRecord } from "./types"

const STALE_TIME = 10 * 60 * 1000
const GC_TIME = 15 * 60 * 1000

interface PayrollPageClientProps {
  initialPayrolls?: PayrollRecord[]
}

export function PayrollPageClient({ initialPayrolls = [] }: PayrollPageClientProps) {
  const { token } = useAuthStore()
  const { hasPermission } = useAuthStore()
  const { showToast } = useToast()
  const queryClient = useQueryClient()
  const [selectedPayroll, setSelectedPayroll] = useState<PayrollRecord | null>(null)
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false)
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false)
  const [overrideTarget, setOverrideTarget] = useState<{ employeeId: string; payPeriod: string } | null>(null)
  const [hasHydrated, setHasHydrated] = useState(false)

  useEffect(() => {
    const unsub = useAuthStore.persist.onFinishHydration(() => {
      setHasHydrated(true)
    })
    if (useAuthStore.persist.hasHydrated()) {
      setHasHydrated(true)
    }
    return unsub
  }, [])

  const canViewPayroll = hasHydrated && hasPermission(PERMISSIONS.VIEW_PAYROLL)
  const canConfigurePayroll = hasHydrated && hasPermission(PERMISSIONS.CONFIGURE_PAYROLL)
  const canManagePayroll = hasHydrated && hasPermission(PERMISSIONS.MANAGE_PAYROLL)

  const payrollQuery = useQuery<PayrollRecord[]>({
    queryKey: ["payroll", "list"],
    queryFn: () => fetchPayrollRecords(token ?? undefined),
    enabled: !!token,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    refetchOnWindowFocus: false,
    initialData: initialPayrolls,
  })

  const payrollConfigQuery = useQuery({
    queryKey: ["payroll", "config"],
    queryFn: () => fetchPayrollConfig(token ?? undefined),
    enabled: !!token && hasPermission(PERMISSIONS.CONFIGURE_PAYROLL),
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    refetchOnWindowFocus: false,
  })

  const payrollConfigMutation = useMutation({
    mutationFn: (config: Parameters<typeof updatePayrollConfig>[0]) => updatePayrollConfig(config, token ?? undefined),
    onSuccess: () => {
      showToast("Payroll configuration saved", "success")
      queryClient.invalidateQueries({ queryKey: ["payroll", "config"] })
    },
    onError: (error: unknown) =>
      handleCrudError({
        error,
        resourceLabel: "Payroll configuration",
        showToast,
      }),
  })

  const payrollOverrideQuery = useQuery({
    queryKey: ["payroll", "override", overrideTarget?.employeeId, overrideTarget?.payPeriod],
    queryFn: () =>
      overrideTarget
        ? fetchPayrollOverride(overrideTarget.employeeId, overrideTarget.payPeriod, token ?? undefined)
        : Promise.resolve(null),
    enabled: !!token && !!overrideTarget && hasPermission(PERMISSIONS.MANAGE_PAYROLL),
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    refetchOnWindowFocus: false,
  })

  const upsertPayrollOverrideMutation = useMutation({
    mutationFn: (config: Parameters<typeof upsertPayrollOverride>[2]) => {
      if (!overrideTarget) throw new Error("Override target missing")
      return upsertPayrollOverride(overrideTarget.employeeId, overrideTarget.payPeriod, config, token ?? undefined)
    },
    onSuccess: () => {
      showToast("Payroll override saved", "success")
      queryClient.invalidateQueries({
        queryKey: ["payroll", "override", overrideTarget?.employeeId, overrideTarget?.payPeriod],
      })
    },
    onError: (error: unknown) => handleCrudError({ error, resourceLabel: "Payroll override", showToast }),
  })

  const deletePayrollOverrideMutation = useMutation({
    mutationFn: async () => {
      if (!overrideTarget) return false
      return deletePayrollOverride(overrideTarget.employeeId, overrideTarget.payPeriod, token ?? undefined)
    },
    onSuccess: (removed) => {
      showToast(removed ? "Payroll override removed" : "Payroll override not found", removed ? "success" : "info")
      queryClient.invalidateQueries({
        queryKey: ["payroll", "override", overrideTarget?.employeeId, overrideTarget?.payPeriod],
      })
    },
    onError: (error: unknown) => handleCrudError({ error, resourceLabel: "Payroll override", showToast }),
  })

  const stats = useMemo(() => {
    const list = Array.isArray(payrollQuery.data) ? payrollQuery.data : []
    const total = list.reduce((acc, curr) => acc + Number(curr.netSalary ?? 0), 0)
    const pending = list.filter((r) => r.status === "draft").length
    const processed = list.filter((r) => r.status === "paid").length
    return { totalCost: total, pendingCount: pending, processedCount: processed }
  }, [payrollQuery.data])

  const generateMutation = useMutation({
    mutationFn: (payPeriod: string) => generatePayroll(payPeriod, token ?? undefined),
    onSuccess: () => {
      showToast("Payroll generated successfully!", "success")
      queryClient.invalidateQueries({ queryKey: ["payroll", "list"] })
    },
    onError: (error: unknown) =>
      handleCrudError({
        error,
        resourceLabel: "Payroll generation",
        showToast,
      }),
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: PayrollRecord["status"] }) =>
      updatePayrollStatus(id, status, token ?? undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll", "list"] })
    },
    onError: (error: unknown) =>
      handleCrudError({
        error,
        resourceLabel: "Payroll status",
        showToast,
      }),
  })

  const columns: Column<PayrollRecord>[] = [
    {
      header: "Employee",
      key: "employee",
      render: (_, record) => (
        <div>
          <div className="font-medium text-gray-900">
            {record.employee.firstName} {record.employee.lastName}
          </div>
          <div className="text-xs text-gray-500">{record.employee.employeeNumber}</div>
        </div>
      ),
    },
    {
      header: "Period",
      key: "payPeriod",
      render: (val) => <span className="font-mono text-sm">{val}</span>,
    },
    {
      header: "Net Salary",
      key: "netSalary",
      render: (val) => <span className="font-semibold text-gray-900">${Number(val).toFixed(2)}</span>,
    },
    {
      header: "Status",
      key: "status",
      render: (val: PayrollRecord["status"]) => {
        const colors: Record<PayrollRecord["status"], string> = {
          draft: "bg-yellow-100 text-yellow-800",
          processed: "bg-blue-100 text-blue-800",
          paid: "bg-green-100 text-green-800",
          error: "bg-red-100 text-red-800",
        }
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[val] || "bg-gray-100"}`}>
            {val.toUpperCase()}
          </span>
        )
      },
    },
    {
      header: "Actions",
      key: "actions",
      render: (_, record) => (
        <div className="flex space-x-2 justify-end">
          <button
            onClick={() => {
              if (!canManagePayroll) return
              setOverrideTarget({ employeeId: record.employeeId, payPeriod: record.payPeriod })
            }}
            disabled={!canManagePayroll}
            className={`p-1 ${
              canManagePayroll
                ? "text-gray-700 hover:text-gray-900"
                : "text-gray-300 cursor-not-allowed"
            }`}
            title="Override payroll adjustments"
          >
            <AdjustmentsHorizontalIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => {
              setSelectedPayroll(record)
              setIsModalOpen(true)
            }}
            className="text-blue-600 hover:text-blue-900 p-1"
            title="View Payslip"
          >
            <DocumentTextIcon className="h-5 w-5" />
          </button>
          {record.status === "draft" && (
            <button
              onClick={() => statusMutation.mutate({ id: record.id, status: "paid" })}
              disabled={statusMutation.isPending}
              className="text-green-600 hover:text-green-900 p-1 disabled:opacity-50"
              title="Mark as Paid"
            >
              <CheckCircleIcon className="h-5 w-5" />
            </button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="space-y-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Payroll Management</h1>
                <p className="text-sm text-gray-500 mt-1">Manage salaries, payslips, and payments.</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsExportModalOpen(true)}
                  disabled={!canViewPayroll}
                  className={`px-4 py-2 rounded-lg flex items-center shadow-lg transition-all active:scale-95 ${
                    canViewPayroll
                      ? "bg-gray-900 text-white hover:bg-gray-800 shadow-gray-900/20 hover:scale-105"
                      : "bg-gray-200 text-gray-400 shadow-gray-900/0 cursor-not-allowed"
                  }`}
                >
                  Export Period CSV
                </button>
                <button
                  onClick={() => setIsConfigModalOpen(true)}
                  disabled={!canConfigurePayroll}
                  className={`px-4 py-2 rounded-lg flex items-center shadow-lg transition-all active:scale-95 ring-1 ring-inset ${
                    canConfigurePayroll
                      ? "bg-white text-gray-900 hover:bg-gray-50 shadow-gray-900/10 hover:scale-105 ring-gray-200"
                      : "bg-gray-100 text-gray-400 shadow-gray-900/0 cursor-not-allowed ring-gray-100"
                  }`}
                >
                  Configure Payroll
                </button>
                <button
                  onClick={() => setIsGenerateModalOpen(true)}
                  disabled={generateMutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center shadow-lg shadow-blue-900/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-60"
                >
                  <BanknotesIcon className="h-5 w-5 mr-2" />
                  {generateMutation.isPending ? "Generating..." : "Generate Payroll"}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Cost (Period)</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">${stats.totalCost.toFixed(2)}</p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                    <BanknotesIcon className="h-6 w-6" />
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Pending (Draft)</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">{stats.pendingCount}</p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-yellow-50 text-yellow-600 flex items-center justify-center">
                    <ClockIcon className="h-6 w-6" />
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Processed (Paid)</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">{stats.processedCount}</p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center">
                    <CheckCircleIcon className="h-6 w-6" />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">Payroll Records</h2>
                <div className="text-sm text-gray-500">
                  {payrollQuery.isLoading ? "Loading..." : `${payrollQuery.data?.length ?? 0} records`}
                </div>
              </div>

              <DataTable columns={columns} data={payrollQuery.data ?? []} loading={payrollQuery.isLoading} />
            </div>
          </div>
        </main>
      </div>

      <PayslipModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} payroll={selectedPayroll} />

      <GeneratePayrollModal
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
        onGenerate={async (payPeriod) => {
          await generateMutation.mutateAsync(payPeriod)
        }}
      />

      <ExportPayrollModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExport={async (payPeriod) => {
          try {
            await downloadPayrollPeriodCsv(payPeriod, token ?? undefined)
            showToast("Payroll exported", "success")
          } catch (error: unknown) {
            handleCrudError({ error, resourceLabel: "Payroll period export", showToast })
          }
        }}
      />

      <PayrollConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        loading={payrollConfigQuery.isLoading || payrollConfigMutation.isPending}
        initialConfig={payrollConfigQuery.data ?? null}
        onSave={async (config) => {
          await payrollConfigMutation.mutateAsync(config)
        }}
      />

      <PayrollConfigModal
        isOpen={!!overrideTarget}
        onClose={() => setOverrideTarget(null)}
        loading={
          payrollOverrideQuery.isLoading ||
          upsertPayrollOverrideMutation.isPending ||
          deletePayrollOverrideMutation.isPending
        }
        initialConfig={payrollOverrideQuery.data ?? null}
        onSave={async (config) => {
          await upsertPayrollOverrideMutation.mutateAsync(config)
        }}
        onDelete={
          payrollOverrideQuery.data
            ? async () => {
                await deletePayrollOverrideMutation.mutateAsync()
              }
            : undefined
        }
        deleteLabel="Remove Override"
      />
    </div>
  )
}
