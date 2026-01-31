"use client"

import { useMemo } from "react"

import {
  PayslipModal,
  PayrollHeader,
  PayrollRecordsTable,
  PayrollStatsGrid,
} from "@/components/features/payroll"
import GeneratePayrollModal from "@/components/hrm/GeneratePayrollModal"
import ExportPayrollModal from "@/components/hrm/ExportPayrollModal"
import PayrollConfigModal from "@/components/hrm/PayrollConfigModal"
import MarkPayrollPaidModal from "@/components/hrm/MarkPayrollPaidModal"
import Sidebar from "@/components/ui/Sidebar"
import Header from "@/components/ui/Header"
import { usePayrollPage } from "@/hooks/usePayrollPage"
import { PayrollRecord } from "@/services/payroll/types"

interface PayrollPageClientProps {
  initialPayrolls?: PayrollRecord[]
}

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
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
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
            await handleExportPeriodCsv(payPeriod)
            showToast("Payroll exported", "success")
          } catch (error: unknown) {
            showToast("Failed to export payroll", "error")
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

      <MarkPayrollPaidModal
        isOpen={!!markPaidTarget}
        onClose={() => setMarkPaidTarget(null)}
        onConfirm={async (payload) => {
          if (!markPaidTarget) return
          await statusMutation.mutateAsync({ id: markPaidTarget.id, status: "paid", meta: payload })
          showToast("Payroll marked as paid", "success")
        }}
      />
    </div>
  )
}
