'use client'

import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import Sidebar from '@/components/ui/Sidebar'
import Header from '@/components/ui/Header'
import { useAuthStore } from '@/store/useAuthStore'
import { useToast } from '@/components/ui/ToastProvider'
import {
    ComplianceRule,
    ComplianceLog,
    RuleList,
    ViolationLog,
    RuleForm
} from '@/components/hrm/ComplianceComponents'
import { PlusIcon, PlayIcon } from '@heroicons/react/24/outline'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

export default function CompliancePage() {
    const { token } = useAuthStore()
    const { showToast } = useToast()

    const [rules, setRules] = useState<ComplianceRule[]>([])
    const [logs, setLogs] = useState<ComplianceLog[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [actionLoading, setActionLoading] = useState(false)

    const fetchData = useCallback(async () => {
        if (!token) return
        setLoading(true)
        try {
            const [rulesRes, logsRes] = await Promise.all([
                axios.get(`${API_URL}/compliance/rules`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${API_URL}/compliance/logs`, { headers: { Authorization: `Bearer ${token}` } })
            ])

            if (rulesRes.data.success) setRules(rulesRes.data.data)
            if (logsRes.data.success) setLogs(logsRes.data.data)
        } catch (error) {
            console.error('Failed to fetch compliance data', error)
            // showToast('Failed to load compliance data', 'error')
        } finally {
            setLoading(false)
        }
    }, [token, showToast])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    const handleCreateRule = async (data: Partial<ComplianceRule>) => {
        if (!token) return
        setActionLoading(true)
        try {
            await axios.post(`${API_URL}/compliance/rules`, data, {
                headers: { Authorization: `Bearer ${token}` }
            })
            showToast('Rule created successfully', 'success')
            setIsModalOpen(false)
            fetchData()
        } catch (error: any) {
            const msg = error.response?.data?.message || 'Failed to create rule'
            showToast(msg, 'error')
        } finally {
            setActionLoading(false)
        }
    }

    const handleToggleRule = async (id: string) => {
        if (!token) return
        try {
            await axios.patch(`${API_URL}/compliance/rules/${id}/toggle`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            })
            fetchData()
        } catch (error) {
            showToast('Failed to update rule status', 'error')
        }
    }

    const handleRunCheck = async () => {
        if (!token) return
        setActionLoading(true)
        try {
            const res = await axios.post(`${API_URL}/compliance/run`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            })
            showToast(res.data.message, 'success')
            fetchData()
        } catch (error) {
            showToast('Compliance check failed', 'error')
        } finally {
            setActionLoading(false)
        }
    }

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
            />
        </div>
    )
}
