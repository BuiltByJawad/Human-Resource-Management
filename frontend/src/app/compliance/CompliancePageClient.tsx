"use client"

import Sidebar from "@/components/ui/Sidebar"
import Header from "@/components/ui/Header"
import { ComplianceHeader, RuleForm, RuleList, ViolationLog } from "@/components/features/compliance"
import type { ComplianceLog, ComplianceRule } from "@/services/compliance/types"
import { useCompliancePage } from "@/hooks/useCompliancePage"

interface CompliancePageClientProps {
  initialRules: ComplianceRule[]
  initialLogs: ComplianceLog[]
}

export function CompliancePageClient({ initialRules, initialLogs }: CompliancePageClientProps) {
  const {
    rules,
    logs,
    isLoadingRules,
    isLoadingLogs,
    isModalOpen,
    setIsModalOpen,
    formErrors,
    setFormErrors,
    handleCreateRule,
    handleToggleRule,
    handleRunCheck,
    actionLoading,
  } = useCompliancePage({ initialRules, initialLogs })

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <ComplianceHeader
              onRunCheck={handleRunCheck}
              onAddRule={() => setIsModalOpen(true)}
              disabled={actionLoading || isLoadingRules || isLoadingLogs}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1 space-y-6">
                <div className="bg-white shadow rounded-lg p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Active Rules</h2>
                  <RuleList rules={rules} onToggle={handleToggleRule} />
                </div>
              </div>

              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white shadow rounded-lg p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Violation Logs</h2>
                  <ViolationLog logs={logs} />
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      <RuleForm
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateRule}
        loading={actionLoading}
        apiErrors={formErrors}
        onClearApiErrors={(field) => {
          setFormErrors((prev) => {
            if (!prev[field]) return prev
            const next = { ...prev }
            delete next[field]
            return next
          })
        }}
      />
    </div>
  )
}
