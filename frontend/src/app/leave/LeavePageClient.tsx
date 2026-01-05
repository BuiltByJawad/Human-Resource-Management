'use client'

import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { PlusIcon, FunnelIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline'

import Sidebar from '@/components/ui/Sidebar'
import Header from '@/components/ui/Header'
import { LeaveRequestCard, LeaveRequestForm, type LeaveRequest, type LeaveRequestFormData, fetchLeaveRequests, createLeaveRequest, approveLeave, rejectLeave } from '@/features/leave'
import { Modal } from '@/components/ui/Modal'
import { Button, Select } from '@/components/ui/FormComponents'
import { useToast } from '@/components/ui/ToastProvider'
import { useAuth } from '@/features/auth'
import { PERMISSIONS } from '@/shared/constants/permissions'
import { handleCrudError } from '@/lib/apiError'
import { Skeleton } from '@/components/ui/Skeleton'

interface LeavePageClientProps {
  initialRequests: LeaveRequest[]
}

export function LeavePageClient({ initialRequests }: LeavePageClientProps) {
  const { token, hasAnyPermission } = useAuth()
  const { showToast } = useToast()
  const queryClient = useQueryClient()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')

  const canManage = false

  const leaveQuery = useQuery<LeaveRequest[], Error>({
    queryKey: ['leave', filterStatus, token],
    queryFn: () =>
			fetchLeaveRequests(
				{
					status: filterStatus,
				},
				token ?? undefined,
			),
    enabled: !!token,
    retry: false,
    initialData: filterStatus === 'all' ? initialRequests : undefined,
    initialDataUpdatedAt: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  })

  const createMutation = useMutation({
    mutationFn: (payload: LeaveRequestFormData) =>
			createLeaveRequest(payload, token ?? undefined),
    onSuccess: async () => {
      showToast('Leave request submitted successfully', 'success')
      await queryClient.invalidateQueries({ queryKey: ['leave'] })
      setIsModalOpen(false)
    },
    onError: (error: any) =>
      handleCrudError({
        error,
        resourceLabel: 'Leave request',
        showToast
      })
  })

  const approveMutation = useMutation({
		mutationFn: (id: string) => approveLeave(id, token ?? undefined),
    onSuccess: () => {
      showToast('Leave request approved', 'success')
      queryClient.invalidateQueries({ queryKey: ['leave'] })
    },
    onError: (error: any) =>
      handleCrudError({
        error,
        resourceLabel: 'Leave request',
        showToast
      })
  })

  const rejectMutation = useMutation({
		mutationFn: (id: string) => rejectLeave(id, token ?? undefined),
    onSuccess: () => {
      showToast('Leave request rejected', 'success')
      queryClient.invalidateQueries({ queryKey: ['leave'] })
    },
    onError: (error: any) =>
      handleCrudError({
        error,
        resourceLabel: 'Leave request',
        showToast
      })
  })

  const handleCreateRequest = async (data: LeaveRequestFormData) => {
    await createMutation.mutateAsync(data)
  }

  const handleApprove = (id: string) => approveMutation.mutate(id)
  const handleReject = (id: string) => rejectMutation.mutate(id)

  const requests = useMemo(() => leaveQuery.data || [], [leaveQuery.data])

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
                      onChange={(value) => setFilterStatus(value as typeof filterStatus)}
                      options={[
                        { value: 'all', label: 'All Status' },
                        { value: 'pending', label: 'Pending' },
                        { value: 'approved', label: 'Approved' },
                        { value: 'rejected', label: 'Rejected' }
                      ]}
                    />
                  </div>
                </div>
                <Button variant="primary" onClick={() => setIsModalOpen(true)} className="flex items-center space-x-2">
                  <PlusIcon className="h-4 w-4" />
                  <span>Request Leave</span>
                </Button>
              </div>
            </div>

            {leaveQuery.isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-3 rounded-lg border bg-white p-4 shadow-sm">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-2/3" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ))}
              </div>
            ) : leaveQuery.isError ? (
              <div className="text-red-600 text-sm">Failed to load leave requests. Please try again.</div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {requests.map((request) => (
                    <LeaveRequestCard
                      key={request.id}
                      request={request}
                      onApprove={handleApprove}
                      onReject={handleReject}
                      canApprove={false}
                      canManageLeave={false}
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

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Request Leave">
        <LeaveRequestForm onSubmit={handleCreateRequest} onCancel={() => setIsModalOpen(false)} loading={createMutation.isPending} />
      </Modal>
    </div>
  )
}
