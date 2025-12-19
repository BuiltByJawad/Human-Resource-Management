'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/axios'
import Sidebar from '@/components/ui/Sidebar'
import Header from '@/components/ui/Header'
import { useAuthStore } from '@/store/useAuthStore'
import { useToast } from '@/components/ui/ToastProvider'
import {
    ComplianceRule,
    ComplianceLog,
    RuleList,
    ViolationLog,
    RuleForm,
    RuleFormField
} from '@/components/hrm/ComplianceComponents'
import { PlusIcon, PlayIcon } from '@heroicons/react/24/outline'
import { handleCrudError } from '@/lib/apiError'

export default function CompliancePage() {
    const { token } = useAuthStore()
    const { showToast } = useToast()
    const queryClient = useQueryClient()

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [formErrors, setFormErrors] = useState<Partial<Record<RuleFormField, string>>>({})

    const {
        data: rules = [],
        isLoading: isLoadingRules,
        isError: isRulesError,
        error: rulesError,
    } = useQuery<ComplianceRule[], Error>({
        queryKey: ['compliance', 'rules', token],
        queryFn: async () => {
            const res = await api.get('/compliance/rules')
            return res.data?.data ?? []
        },
        enabled: !!token,
        retry: false,
        initialData: [] as ComplianceRule[],
    })

    const {
        data: logs = [],
        isLoading: isLoadingLogs,
        isError: isLogsError,
        error: logsError,
    } = useQuery<ComplianceLog[], Error>({
        queryKey: ['compliance', 'logs', token],
        queryFn: async () => {
            const res = await api.get('/compliance/logs')
            return res.data?.data ?? []
        },
        enabled: !!token,
        retry: false,
        initialData: [] as ComplianceLog[],
    })

    useEffect(() => {
        if (isRulesError && rulesError) {
            handleCrudError({
                error: rulesError,
                resourceLabel: 'Compliance rules',
                showToast,
            })
        }
    }, [isRulesError, rulesError, showToast])

    useEffect(() => {
        if (isLogsError && logsError) {
            handleCrudError({
                error: logsError,
                resourceLabel: 'Compliance logs',
                showToast,
            })
        }
    }, [isLogsError, logsError, showToast])

    const createRuleMutation = useMutation({
        mutationFn: (data: Partial<ComplianceRule>) => api.post('/compliance/rules', data),
        onSuccess: () => {
            showToast('Rule created successfully', 'success')
            setFormErrors({})
            setIsModalOpen(false)
            queryClient.invalidateQueries({ queryKey: ['compliance', 'rules'] })
        },
        onError: (error: any) =>
            handleCrudError({
                error,
                resourceLabel: 'Compliance rule',
                showToast,
                setFieldError: (field, message) => {
                    setFormErrors((prev) => ({ ...prev, [field as RuleFormField]: message }))
                },
                defaultField: 'name',
                onUnauthorized: () => console.warn('Not authorized to manage compliance rules'),
            }),
    })

    const toggleRuleMutation = useMutation({
        mutationFn: (id: string) => api.patch(`/compliance/rules/${id}/toggle`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['compliance', 'rules'] })
        },
        onError: (error: any) =>
            handleCrudError({
                error,
                resourceLabel: 'Compliance rule',
                showToast,
            }),
    })

    const runCheckMutation = useMutation({
        mutationFn: () => api.post('/compliance/run'),
        onSuccess: (res) => {
            showToast(res?.data?.message || 'Compliance check completed', 'success')
            queryClient.invalidateQueries({ queryKey: ['compliance', 'logs'] })
        },
        onError: (error: any) =>
            handleCrudError({
                error,
                resourceLabel: 'Compliance check',
                showToast,
            }),
    })

    const actionLoading =
        createRuleMutation.isPending || toggleRuleMutation.isPending || runCheckMutation.isPending

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
                                    disabled={actionLoading}
                                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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
