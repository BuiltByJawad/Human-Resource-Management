'use client'

import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FunnelIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline'

import Sidebar from '@/components/ui/Sidebar'
import Header from '@/components/ui/Header'
import { LeaveRequestCard, type LeaveRequest, fetchLeaveRequests, approveLeave, rejectLeave, cancelLeave } from '@/features/leave'
import { Button, Select } from '@/components/ui/FormComponents'
import { useToast } from '@/components/ui/ToastProvider'
import { useAuth } from '@/features/auth'
import { PERMISSIONS } from '@/shared/constants/permissions'
import { handleCrudError } from '@/lib/apiError'
import { Skeleton } from '@/components/ui/Skeleton'

interface LeaveRequestsPageClientProps {
  initialRequests: LeaveRequest[]
  initialHasToken?: boolean
}

export function LeaveRequestsPageClient({ initialRequests, initialHasToken = false }: LeaveRequestsPageClientProps) {
  const { token, hasAnyPermission } = useAuth()
  const { showToast } = useToast()
  const queryClient = useQueryClient()

  const [filterStatus, setFilterStatus] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending')

  const canApprove = hasAnyPermission([PERMISSIONS.APPROVE_LEAVE])
  const canManageLeave = hasAnyPermission([PERMISSIONS.MANAGE_LEAVE_REQUESTS, PERMISSIONS.MANAGE_LEAVE_POLICIES])
  const canView = hasAnyPermission([
    PERMISSIONS.VIEW_LEAVE_REQUESTS,
    PERMISSIONS.APPROVE_LEAVE,
    PERMISSIONS.MANAGE_LEAVE_REQUESTS,
    PERMISSIONS.MANAGE_LEAVE_POLICIES
  ])

  const hasClientToken = !!token
  const authLoading = initialHasToken && !hasClientToken
  const hasAnyToken = hasClientToken || initialHasToken

  const leaveQuery = useQuery<LeaveRequest[], Error>({
    queryKey: ['leave-requests', filterStatus, token],
    queryFn: () =>
      fetchLeaveRequests(
        {
          status: filterStatus,
        },
        token ?? undefined,
      ),
    enabled: hasClientToken && canView,
    retry: false,
    initialData: filterStatus === 'pending' ? initialRequests : undefined,
    initialDataUpdatedAt: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  })

  const cancelMutation = useMutation({
    mutationFn: (id: string) => cancelLeave(id, token ?? undefined),
    onSuccess: () => {
      showToast('Leave request cancelled', 'success')
      queryClient.invalidateQueries({ queryKey: ['leave'] })
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] })
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
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] })
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
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] })
    },
    onError: (error: any) =>
      handleCrudError({
        error,
        resourceLabel: 'Leave request',
        showToast
      })
  })

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
                <h1 className="text-2xl font-bold text-gray-900">Leave Requests</h1>
                <p className="text-sm text-gray-500">Approve or reject employee leave requests</p>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center space-x-2">
                  <FunnelIcon className="h-5 w-5 text-gray-400" />
                  <div className="w-48">
                    <Select
                      value={filterStatus}
                      onChange={(value) => setFilterStatus(value as typeof filterStatus)}
                      options={[
                        { value: 'pending', label: 'Pending' },
                        { value: 'approved', label: 'Approved' },
                        { value: 'rejected', label: 'Rejected' },
                        { value: 'all', label: 'All Status' },
                      ]}
                    />
                  </div>
                </div>

                <Button
                  variant="secondary"
                  onClick={() => {
                    queryClient.invalidateQueries({ queryKey: ['leave-requests'] })
                  }}
                >
                  Refresh
                </Button>
              </div>
            </div>

            {authLoading ? (
              <div className="text-sm text-gray-500">Loading your access to leave requests…</div>
            ) : !hasAnyToken ? (
              <div className="text-sm text-gray-600">Please log in to view leave requests.</div>
            ) : !canView ? (
              <div className="text-sm text-red-600">You do not have permission to view leave requests.</div>
            ) : leaveQuery.isLoading ? (
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
                      onApprove={(id) => canApprove && approveMutation.mutate(id)}
                      onReject={(id) => canApprove && rejectMutation.mutate(id)}
                      onCancel={(id) => {
                        if (!canManageLeave) return
                        const ok = window.confirm('Cancel this leave request?')
                        if (!ok) return
                        cancelMutation.mutate(id)
                      }}
                      canApprove={canApprove}
                      canManageLeave={canManageLeave}
                    />
                  ))}
                </div>

                {requests.length === 0 && (
                  <div className="text-center py-12">
                    <ClipboardDocumentListIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No leave requests found</h3>
                    <p className="text-gray-500 mb-6">
                      Try adjusting your filters.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
