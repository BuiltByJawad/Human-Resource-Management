"use client"

import { useMemo } from "react"
import dynamic from "next/dynamic"

import {
  PayrollHeader,
  PayrollRecordsTable,
  PayrollStatsGrid,
} from "@/components/features/payroll"
import { usePayrollPage } from "@/hooks/usePayrollPage"
import { PayrollRecord } from "@/services/payroll/types"

interface PayrollPageClientProps {
  initialPayrolls?: PayrollRecord[]
}

const PayslipModal = dynamic(
  () => import("@/components/features/payroll/PayslipModal").then((mod) => mod.PayslipModal),
  { ssr: false }
)
const GeneratePayrollModal = dynamic(() => import("@/components/hrm/GeneratePayrollModal"), { ssr: false })
const ExportPayrollModal = dynamic(() => import("@/components/hrm/ExportPayrollModal"), { ssr: false })
const PayrollConfigModal = dynamic(() => import("@/components/hrm/PayrollConfigModal"), { ssr: false })
const MarkPayrollPaidModal = dynamic(() => import("@/components/hrm/MarkPayrollPaidModal"), { ssr: false })

export function PayrollPageClient({ initialPayrolls = [] }: PayrollPageClientProps) {
  const {
    payrollQuery,
    payrollConfigQuery,
    payrollConfigMutation,
    payrollOverrideQuery,
    upsertPayrollOverrideMutation,
    deletePayrollOverrideMutation,
    stats,
    generateMutation,
    statusMutation,
    selectedPayroll,
    setSelectedPayroll,
    isGenerateModalOpen,
    setIsGenerateModalOpen,
    isExportModalOpen,
    setIsExportModalOpen,
    isModalOpen,
    setIsModalOpen,
    isConfigModalOpen,
    setIsConfigModalOpen,
    overrideTarget,
    setOverrideTarget,
    markPaidTarget,
    setMarkPaidTarget,
    hasHydrated,
    canViewPayrollAction,
    canConfigurePayrollAction,
    canManagePayrollAction,
    canViewPayrollUi,
    canConfigurePayrollUi,
    canManagePayrollUi,
    handleExportPeriodCsv,
    showToast,
  } = usePayrollPage({ initialPayrolls })

  const statsDisplay = useMemo(
    () => ({
      totalCost: stats.totalCost,
      pendingCount: stats.pendingCount,
      approvedCount: stats.approvedCount,
      paidCount: stats.paidCount,
    }),
    [stats]
  )

  return (
    <div className="p-4 md:p-6">
      <div className="space-y-6 max-w-7xl mx-auto">
        <PayrollHeader
          canViewPayrollUi={canViewPayrollUi}
          canConfigurePayrollUi={canConfigurePayrollUi}
          canManagePayrollUi={canManagePayrollUi}
          isHydrated={hasHydrated}
          canViewPayrollAction={canViewPayrollAction}
          canConfigurePayrollAction={canConfigurePayrollAction}
          canManagePayrollAction={canManagePayrollAction}
          onExport={() => setIsExportModalOpen(true)}
          onConfigure={() => setIsConfigModalOpen(true)}
          onGenerate={() => setIsGenerateModalOpen(true)}
          onLoadingPermissions={() => showToast('Loading permissions...', 'info')}
        />

        <PayrollStatsGrid {...statsDisplay} />

        <PayrollRecordsTable
          records={payrollQuery.data ?? []}
          isLoading={payrollQuery.isLoading}
          canManagePayrollAction={canManagePayrollAction}
          canManagePayrollUi={canManagePayrollUi}
          hasHydrated={hasHydrated}
          showToast={showToast}
          setOverrideTarget={setOverrideTarget}
          setSelectedPayroll={setSelectedPayroll}
          setIsModalOpen={setIsModalOpen}
          statusMutation={statusMutation}
          setMarkPaidTarget={setMarkPaidTarget}
        />
      </div>

      {isModalOpen && (
        <PayslipModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} payroll={selectedPayroll} />
      )}

      {isGenerateModalOpen && (
        <GeneratePayrollModal
          isOpen={isGenerateModalOpen}
          onClose={() => setIsGenerateModalOpen(false)}
          onGenerate={async (payPeriod) => {
            await generateMutation.mutateAsync(payPeriod)
          }}
        />
      )}

      {isExportModalOpen && (
        <ExportPayrollModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          onExport={async (payPeriod) => {
            try {
              await handleExportPeriodCsv(payPeriod)
              showToast("Payroll exported", "success")
            } catch (error: unknown) {
              showToast("Failed to export payroll", "error")
            }
          }}
        />
      )}

      {isConfigModalOpen && (
        <PayrollConfigModal
          isOpen={isConfigModalOpen}
          onClose={() => setIsConfigModalOpen(false)}
          loading={payrollConfigQuery.isLoading || payrollConfigMutation.isPending}
          initialConfig={payrollConfigQuery.data ?? null}
          onSave={async (config) => {
            await payrollConfigMutation.mutateAsync(config)
          }}
        />
      )}

      {!!overrideTarget && (
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
      )}

      {!!markPaidTarget && (
        <MarkPayrollPaidModal
          isOpen={!!markPaidTarget}
          onClose={() => setMarkPaidTarget(null)}
          onConfirm={async (payload) => {
            if (!markPaidTarget) return
            await statusMutation.mutateAsync({ id: markPaidTarget.id, status: "paid", meta: payload })
            showToast("Payroll marked as paid", "success")
          }}
        />
      )}
    </div>
  )
}
