"use client"

import { useEffect, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { PlusIcon, PlayIcon } from "@heroicons/react/24/outline"

import Sidebar from "@/components/ui/Sidebar"
import Header from "@/components/ui/Header"
import { useAuth } from "@/features/auth"
import { useToast } from "@/components/ui/ToastProvider"
import {
  RuleList,
  ViolationLog,
  RuleForm,
  type ComplianceRule,
  type ComplianceLog,
  type RuleFormField,
} from "@/components/hrm/ComplianceComponents"
import { handleCrudError } from "@/lib/apiError"
import {
  createComplianceRule,
  fetchComplianceLogs,
  fetchComplianceRules,
  runComplianceCheck,
  toggleComplianceRule,
} from "@/features/compliance"

interface CompliancePageClientProps {
  initialRules: ComplianceRule[]
  initialLogs: ComplianceLog[]
}

export function CompliancePageClient({ initialRules, initialLogs }: CompliancePageClientProps) {
  const { token } = useAuth()
  const { showToast } = useToast()
  const queryClient = useQueryClient()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formErrors, setFormErrors] = useState<Partial<Record<RuleFormField, string>>>({})

  const {
    data: rules = [],
    isLoading: isLoadingRules,
    isError: isRulesError,
    error: rulesError,
  } = useQuery<ComplianceRule[]>({
    queryKey: ["compliance", "rules", token],
    queryFn: () => fetchComplianceRules(token ?? undefined),
    enabled: !!token,
    retry: false,
    initialData: initialRules,
  })

  const {
    data: logs = [],
    isLoading: isLoadingLogs,
    isError: isLogsError,
    error: logsError,
  } = useQuery<ComplianceLog[]>({
    queryKey: ["compliance", "logs", token],
    queryFn: () => fetchComplianceLogs(token ?? undefined),
    enabled: !!token,
    retry: false,
    initialData: initialLogs,
  })

  useEffect(() => {
    if (isRulesError && rulesError) {
      handleCrudError({
        error: rulesError,
        resourceLabel: "Compliance rules",
        showToast,
      })
    }
  }, [isRulesError, rulesError, showToast])

  useEffect(() => {
    if (isLogsError && logsError) {
      handleCrudError({
        error: logsError,
        resourceLabel: "Compliance logs",
        showToast,
      })
    }
  }, [isLogsError, logsError, showToast])

  const createRuleMutation = useMutation({
    mutationFn: (data: Partial<ComplianceRule>) => createComplianceRule(data, token ?? undefined),
    onSuccess: () => {
      showToast("Rule created successfully", "success")
      setFormErrors({})
      setIsModalOpen(false)
      queryClient.invalidateQueries({ queryKey: ["compliance", "rules"] })
    },
    onError: (error: any) =>
      handleCrudError({
        error,
        resourceLabel: "Compliance rule",
        showToast,
        setFieldError: (field, message) => {
          setFormErrors((prev) => ({ ...prev, [field as RuleFormField]: message }))
        },
        defaultField: "name",
        onUnauthorized: () => console.warn("Not authorized to manage compliance rules"),
      }),
  })

  const toggleRuleMutation = useMutation({
    mutationFn: (id: string) => toggleComplianceRule(id, token ?? undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["compliance", "rules"] })
    },
    onError: (error: any) =>
      handleCrudError({
        error,
        resourceLabel: "Compliance rule",
        showToast,
      }),
  })

  const runCheckMutation = useMutation({
    mutationFn: () => runComplianceCheck(token ?? undefined),
    onSuccess: (result) => {
      showToast(result?.message || "Compliance check completed", "success")
      queryClient.invalidateQueries({ queryKey: ["compliance", "logs"] })
    },
    onError: (error: any) =>
      handleCrudError({
        error,
        resourceLabel: "Compliance check",
        showToast,
      }),
  })

  const actionLoading = createRuleMutation.isPending || toggleRuleMutation.isPending || runCheckMutation.isPending

  const handleCreateRule = async (data: Partial<ComplianceRule>) => {
    await createRuleMutation.mutateAsync(data)
  }
  const handleToggleRule = (id: string) => toggleRuleMutation.mutate(id)
  const handleRunCheck = () => runCheckMutation.mutate()

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Compliance Sentinel</h1>
                <p className="text-sm text-gray-500">Monitor labor law compliance and violations</p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleRunCheck}
                  disabled={actionLoading || isLoadingRules || isLoadingLogs}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-60"
                >
                  <PlayIcon className="-ml-1 mr-2 h-5 w-5 text-gray-500" />
                  Run Check
                </button>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                  Add Rule
                </button>
              </div>
            </div>

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
