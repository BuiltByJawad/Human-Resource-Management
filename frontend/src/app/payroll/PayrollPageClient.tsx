"use client"

import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { BanknotesIcon, CheckCircleIcon, ClockIcon, DocumentTextIcon } from "@heroicons/react/24/outline"

import { DataTable, type Column } from "@/components/ui/DataTable"
import { PayslipModal } from "@/components/hrm/PayslipModal"
import GeneratePayrollModal from "@/components/hrm/GeneratePayrollModal"
import Sidebar from "@/components/ui/Sidebar"
import Header from "@/components/ui/Header"
import { useAuth } from "@/features/auth"
import { useToast } from "@/components/ui/ToastProvider"
import { handleCrudError } from "@/lib/apiError"
import { fetchPayrollRecords, generatePayroll, updatePayrollStatus, type PayrollRecord } from "@/features/payroll"

const STALE_TIME = 10 * 60 * 1000
const GC_TIME = 15 * 60 * 1000

interface PayrollPageClientProps {
  initialPayrolls?: PayrollRecord[]
}

export function PayrollPageClient({ initialPayrolls = [] }: PayrollPageClientProps) {
  const { token } = useAuth()
  const { showToast } = useToast()
  const queryClient = useQueryClient()
  const [selectedPayroll, setSelectedPayroll] = useState<PayrollRecord | null>(null)
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const payrollQuery = useQuery<PayrollRecord[]>({
    queryKey: ["payroll", "list"],
    queryFn: () => fetchPayrollRecords(token ?? undefined),
    enabled: !!token,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    refetchOnWindowFocus: false,
    initialData: initialPayrolls,
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
              <button
                onClick={() => setIsGenerateModalOpen(true)}
                disabled={generateMutation.isPending}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center shadow-lg shadow-blue-900/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-60"
              >
                <BanknotesIcon className="h-5 w-5 mr-2" />
                {generateMutation.isPending ? "Generating..." : "Generate Payroll"}
              </button>
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
    </div>
  )
}
