'use client'

import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/useAuthStore'
import { useToast } from '@/components/ui/ToastProvider'
import { handleCrudError } from '@/lib/apiError'
import { fetchEmployees } from '@/services/employees/api'
import {
  assignAsset,
  createAsset,
  fetchAssets,
  returnAsset,
  updateAsset,
} from '@/services/assets/api'
import type { Asset, AssetsFilterParams, UpsertAssetPayload } from '@/services/assets/types'
import type { Employee, EmployeesPage } from '@/services/employees/types'
import { useDebounce } from '@/hooks/useDebounce'

interface UseAssetsPageOptions {
  initialAssets: Asset[]
  initialEmployees: Employee[]
}

export function useAssetsPage({ initialAssets, initialEmployees }: UseAssetsPageOptions) {
  const { token } = useAuthStore()
  const { showToast } = useToast()
  const queryClient = useQueryClient()

  const [filterStatus, setFilterStatus] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
  const [assetPendingReturn, setAssetPendingReturn] = useState<Asset | null>(null)
  const [isReturnDialogOpen, setIsReturnDialogOpen] = useState(false)

  const debouncedSearch = useDebounce(searchQuery, 500)

  const assetsQuery = useQuery<Asset[]>({
    queryKey: ['assets', filterStatus || 'all', debouncedSearch || '', token],
    queryFn: () =>
      fetchAssets(
        {
          status: (filterStatus || undefined) as AssetsFilterParams['status'],
          search: debouncedSearch || undefined,
        },
        token ?? undefined
      ),
    enabled: !!token,
    initialData: filterStatus === '' && !debouncedSearch ? initialAssets : undefined,
    refetchOnWindowFocus: false,
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

  const invalidateAssets = () => {
    queryClient.invalidateQueries({ queryKey: ['assets'] })
  }

  const createAssetMutation = useMutation({
    mutationFn: (assetData: UpsertAssetPayload) => createAsset(assetData, token ?? undefined),
    onSuccess: () => {
      showToast('Asset created successfully', 'success')
      invalidateAssets()
      setIsFormOpen(false)
      setSelectedAsset(null)
    },
    onError: (error: unknown) =>
      handleCrudError({
        error,
        resourceLabel: 'Asset',
        showToast,
      }),
  })

  const updateAssetMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpsertAssetPayload }) => updateAsset(id, data, token ?? undefined),
    onSuccess: () => {
      showToast('Asset updated successfully', 'success')
      invalidateAssets()
      setIsFormOpen(false)
      setSelectedAsset(null)
    },
    onError: (error: unknown) =>
      handleCrudError({
        error,
        resourceLabel: 'Asset',
        showToast,
      }),
  })

  const assignAssetMutation = useMutation({
    mutationFn: ({ assetId, employeeId, notes }: { assetId: string; employeeId: string; notes: string }) =>
      assignAsset(assetId, { employeeId, notes }, token ?? undefined),
    onSuccess: () => {
      showToast('Asset assigned successfully', 'success')
      invalidateAssets()
      setIsAssignModalOpen(false)
      setSelectedAsset(null)
    },
    onError: (error: unknown) =>
      handleCrudError({
        error,
        resourceLabel: 'Asset assignment',
        showToast,
      }),
  })

  const returnAssetMutation = useMutation({
    mutationFn: (assetId: string) => returnAsset(assetId, token ?? undefined),
    onSuccess: () => {
      showToast('Asset returned successfully', 'success')
      invalidateAssets()
    },
    onError: (error: unknown) =>
      handleCrudError({
        error,
        resourceLabel: 'Asset return',
        showToast,
      }),
  })

  const handleSubmitAsset = async (assetData: UpsertAssetPayload) => {
    if (selectedAsset) {
      await updateAssetMutation.mutateAsync({ id: selectedAsset.id, data: assetData })
    } else {
      await createAssetMutation.mutateAsync(assetData)
    }
  }

  const handleAssignAsset = async (employeeId: string, notes: string) => {
    if (!selectedAsset) return
    await assignAssetMutation.mutateAsync({ assetId: selectedAsset.id, employeeId, notes })
  }

  const handleReturnAsset = (asset: Asset) => {
    setAssetPendingReturn(asset)
    setIsReturnDialogOpen(true)
  }

  const confirmReturnAsset = async () => {
    if (!assetPendingReturn) return
    await returnAssetMutation.mutateAsync(assetPendingReturn.id)
    setIsReturnDialogOpen(false)
    setAssetPendingReturn(null)
  }

  const stats = useMemo(() => {
    const list = assetsQuery.data ?? []
    return {
      total: list.length,
      assigned: list.filter((asset) => asset.status === 'assigned').length,
      available: list.filter((asset) => asset.status === 'available').length,
      maintenance: list.filter((asset) => asset.status === 'maintenance').length,
    }
  }, [assetsQuery.data])

  return {
    assetsQuery,
    employeesQuery,
    filterStatus,
    setFilterStatus,
    searchQuery,
    setSearchQuery,
    isFormOpen,
    setIsFormOpen,
    isAssignModalOpen,
    setIsAssignModalOpen,
    selectedAsset,
    setSelectedAsset,
    assetPendingReturn,
    setAssetPendingReturn,
    isReturnDialogOpen,
    setIsReturnDialogOpen,
    handleSubmitAsset,
    handleAssignAsset,
    handleReturnAsset,
    confirmReturnAsset,
    stats,
    returnAssetMutation,
  }
}
