'use client'

import { useState, useEffect, useCallback } from 'react'
import Sidebar from '@/components/ui/Sidebar'
import Header from '@/components/ui/Header'
import { LeaveRequestCard, LeaveRequestForm, LeaveRequest } from '@/components/hrm/LeaveComponents'
import { Modal } from '@/components/ui/Modal'
import { Button, Select } from '@/components/ui/FormComponents'
import { useToast } from '@/components/ui/ToastProvider'
import { PlusIcon, FunnelIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline'
import { useAuthStore } from '@/store/useAuthStore'
import { PERMISSIONS } from '@/constants/permissions'
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

export default function LeavePage() {
    const { token, hasAnyPermission } = useAuthStore()
    const { showToast } = useToast()

    const [requests, setRequests] = useState<LeaveRequest[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [filterStatus, setFilterStatus] = useState<string>('all')

    const canManage = hasAnyPermission([
        PERMISSIONS.APPROVE_LEAVE,
        PERMISSIONS.MANAGE_LEAVE_REQUESTS,
        PERMISSIONS.MANAGE_LEAVE_POLICIES,
    ])

    const fetchRequests = useCallback(async () => {
        setLoading(true)
        try {
            const params: any = {}
            if (filterStatus !== 'all') params.status = filterStatus

            const response = await axios.get(`${API_URL}/leave`, {
                headers: { Authorization: `Bearer ${token}` },
                params
            })

            if (response.data.success) {
                setRequests(response.data.data)
            }
        } catch (error: any) {
            console.error('Failed to fetch leave requests', error)
            setRequests([])
        } finally {
            setLoading(false)
        }
    }, [token, filterStatus])

    useEffect(() => {
        if (token) {
            fetchRequests()
        }
    }, [token, fetchRequests])

    const handleCreateRequest = async (data: any) => {
        try {
            console.log('Submitting leave request:', data)
            const response = await axios.post(`${API_URL}/leave`, data, {
                headers: { Authorization: `Bearer ${token}` }
            })
            console.log('Leave request submitted:', response.data)
            showToast('Leave request submitted successfully', 'success')

            // Force a small delay to ensure backend consistency
            await new Promise(resolve => setTimeout(resolve, 500))

            await fetchRequests()
            setIsModalOpen(false)
        } catch (error: any) {
            console.error('Failed to submit leave request', error)
            showToast(error.response?.data?.message || 'Failed to submit request', 'error')
        }
    }

    const handleApprove = async (id: string) => {
        try {
            await axios.put(`${API_URL}/leave/${id}/approve`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            })
            showToast('Leave request approved', 'success')
            fetchRequests()
        } catch (error: any) {
            console.error('Failed to approve request', error)
            showToast('Failed to approve request', 'error')
        }
    }

    const handleReject = async (id: string) => {
        try {
            await axios.put(`${API_URL}/leave/${id}/reject`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            })
            showToast('Leave request rejected', 'success')
            fetchRequests()
        } catch (error: any) {
            console.error('Failed to reject request', error)
            showToast('Failed to reject request', 'error')
        }
    }

    return (
        <div className="flex h-screen bg-gray-50">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header />
                <main className="flex-1 overflow-y-auto p-4 md:p-6">
                    <div className="max-w-7xl mx-auto space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Leave Management</h1>
                                <p className="text-sm text-gray-500">Track and manage employee leave requests</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center space-x-2">
                                    <FunnelIcon className="h-5 w-5 text-gray-400" />
                                    <div className="w-48">
                                        <Select
                                            value={filterStatus}
                                            onChange={(value) => setFilterStatus(value)}
                                            options={[
                                                { value: 'all', label: 'All Status' },
                                                { value: 'pending', label: 'Pending' },
                                                { value: 'approved', label: 'Approved' },
                                                { value: 'rejected', label: 'Rejected' },
                                            ]}
                                        />
                                    </div>
                                </div>
                                <Button
                                    variant="primary"
                                    onClick={() => setIsModalOpen(true)}
                                    className="flex items-center space-x-2"
                                >
                                    <PlusIcon className="h-4 w-4" />
                                    <span>Request Leave</span>
                                </Button>
                            </div>
                        </div>

                        {loading ? (
                            <div className="flex justify-center items-center h-64">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {requests.map((request) => (
                                        <LeaveRequestCard
                                            key={request.id}
                                            request={request}
                                            onApprove={handleApprove}
                                            onReject={handleReject}
                                            canManage={canManage}
                                        />
                                    ))}
                                </div>

                                {requests.length === 0 && (
                                    <div className="text-center py-12">
                                        <ClipboardDocumentListIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                                        <h3 className="text-lg font-medium text-gray-900 mb-2">No leave requests found</h3>
                                        <p className="text-gray-500 mb-6">
                                            {filterStatus !== 'all' ? 'Try adjusting your filters.' : 'Create a new request to get started.'}
                                        </p>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </main>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Request Leave"
            >
                <LeaveRequestForm
                    onSubmit={handleCreateRequest}
                    onCancel={() => setIsModalOpen(false)}
                />
            </Modal>
        </div>
    )
}
