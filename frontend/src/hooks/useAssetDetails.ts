'use client'

import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/useAuthStore'
import { useToast } from '@/components/ui/ToastProvider'
import { handleCrudError } from '@/lib/apiError'
import { fetchEmployees } from '@/services/employees/api'
import {
  addMaintenanceLog,
  assignAsset,
  fetchAssetById,
  returnAsset,
} from '@/services/assets/api'
import type { Asset, MaintenancePayload } from '@/services/assets/types'
import type { Employee, EmployeesPage } from '@/services/employees/types'

interface UseAssetDetailsOptions {
  assetId: string
  initialAsset: Asset | null
  initialEmployees: Employee[]
}

export function useAssetDetails({ assetId, initialAsset, initialEmployees }: UseAssetDetailsOptions) {
  const { token } = useAuthStore()
  const { showToast } = useToast()
  const queryClient = useQueryClient()

  const [activeTab, setActiveTab] = useState<'history' | 'maintenance'>('history')
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false)
  const [isReturnDialogOpen, setIsReturnDialogOpen] = useState(false)

  const assetQuery = useQuery<Asset | null>({
    queryKey: ['asset', assetId],
    queryFn: () => fetchAssetById(assetId, token ?? undefined),
    enabled: !!assetId && !!token,
    retry: false,
    initialData: initialAsset ?? undefined,
  })

  const employeesQuery = useQuery<Employee[]>({
    queryKey: ['assets', 'employees', token],
    queryFn: async () => {
      const page = (await fetchEmployees({ page: 1, limit: 200 }, token ?? undefined)) as EmployeesPage
      return page.employees ?? []
    },
    enabled: !!token,
    initialData: initialEmployees,
    staleTime: 5 * 60 * 1000,
  })

  const assignMutation = useMutation({
    mutationFn: ({ employeeId, notes }: { employeeId: string; notes: string }) =>
      assignAsset(assetId, { employeeId, notes }, token ?? undefined),
    onSuccess: () => {
      showToast('Asset assigned successfully', 'success')
      queryClient.invalidateQueries({ queryKey: ['asset', assetId] })
      setIsAssignModalOpen(false)
    },
    onError: (error: unknown) => handleCrudError({ error, resourceLabel: 'Assign asset', showToast }),
  })

  const returnMutation = useMutation({
    mutationFn: () => returnAsset(assetId, token ?? undefined),
    onSuccess: () => {
      showToast('Asset returned successfully', 'success')
      queryClient.invalidateQueries({ queryKey: ['asset', assetId] })
    },
    onError: (error: unknown) => handleCrudError({ error, resourceLabel: 'Return asset', showToast }),
  })

  const maintenanceMutation = useMutation({
    mutationFn: (data: MaintenancePayload) => addMaintenanceLog(assetId, data, token ?? undefined),
    onSuccess: () => {
      showToast('Maintenance log added', 'success')
      queryClient.invalidateQueries({ queryKey: ['asset', assetId] })
      setIsMaintenanceModalOpen(false)
    },
    onError: (error: unknown) => handleCrudError({ error, resourceLabel: 'Add maintenance log', showToast }),
  })

  const currentAssignment = useMemo(
    () => (assetQuery.data?.assignments ?? []).find((assignment) => !assignment.returnedDate),
    [assetQuery.data?.assignments]
  )

  const handleReturn = () => {
    setIsReturnDialogOpen(true)
  }

  const confirmReturn = async () => {
    await returnMutation.mutateAsync()
    setIsReturnDialogOpen(false)
  }

  const handleAssign = async (employeeId: string, notes: string) => {
    await assignMutation.mutateAsync({ employeeId, notes })
  }

  const handleMaintenanceSubmit = async (data: MaintenancePayload) => {
    await maintenanceMutation.mutateAsync(data)
  }

  return {
    assetQuery,
    employeesQuery,
    activeTab,
    setActiveTab,
    isAssignModalOpen,
    setIsAssignModalOpen,
    isMaintenanceModalOpen,
    setIsMaintenanceModalOpen,
    isReturnDialogOpen,
    setIsReturnDialogOpen,
    assignMutation,
    returnMutation,
    maintenanceMutation,
    currentAssignment,
    handleReturn,
    confirmReturn,
    handleAssign,
    handleMaintenanceSubmit,
  }
}
