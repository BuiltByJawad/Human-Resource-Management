"use client"

import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { PlusIcon, FunnelIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline"

import Sidebar from "@/components/ui/Sidebar"
import Header from "@/components/ui/Header"
import { Button } from "@/components/ui/FormComponents"
import { useAuthStore } from "@/store/useAuthStore"
import { useToast } from "@/components/ui/ToastProvider"
import { Asset, AssetCard, AssetForm, AssignmentModal } from "@/components/hrm/AssetComponents"
import { useDebounce } from "@/hooks/useDebounce"
import { ConfirmDialog } from "@/components/ui/ConfirmDialog"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"

interface AssetsPageClientProps {
  initialAssets?: Asset[]
  initialEmployees?: any[]
}

export function AssetsPageClient({
  initialAssets = [],
  initialEmployees = [],
}: AssetsPageClientProps) {
  const { token } = useAuthStore()
  const { showToast } = useToast()
  const queryClient = useQueryClient()

  const [filterStatus, setFilterStatus] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
  const [assetPendingReturn, setAssetPendingReturn] = useState<Asset | null>(null)
  const [isReturnDialogOpen, setIsReturnDialogOpen] = useState(false)

  const debouncedSearch = useDebounce(searchQuery, 500)

  const assetsQuery = useQuery<Asset[]>({
    queryKey: ["assets", filterStatus || "all", debouncedSearch || ""],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filterStatus) params.append("status", filterStatus)
      if (debouncedSearch) params.append("search", debouncedSearch)

      const response = await fetch(`${API_URL}/assets?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const payload = await response.json().catch(() => null)
      if (!response.ok) {
        const message = payload?.message || "Failed to fetch assets"
        throw new Error(message)
      }
      if (Array.isArray(payload?.data)) return payload.data as Asset[]
      if (Array.isArray(payload?.assets)) return payload.assets
      if (Array.isArray(payload)) return payload
      return []
    },
    enabled: !!token,
    initialData: filterStatus === "" && !debouncedSearch ? initialAssets : undefined,
    refetchOnWindowFocus: false,
  })

  const employeesQuery = useQuery<any[]>({
    queryKey: ["assets", "employees"],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/employees`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const payload = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(payload?.message || "Failed to fetch employees")
      }
      if (Array.isArray(payload?.data)) return payload.data
      if (Array.isArray(payload?.employees)) return payload.employees
      if (Array.isArray(payload)) return payload
      return []
    },
    enabled: !!token,
    initialData: initialEmployees,
    staleTime: 5 * 60 * 1000,
  })

  const invalidateAssets = () => {
    queryClient.invalidateQueries({ queryKey: ["assets"] })
  }

  const createAssetMutation = useMutation({
    mutationFn: async (assetData: any) => {
      const response = await fetch(`${API_URL}/assets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(assetData),
      })
      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err?.message || "Failed to create asset")
      }
    },
    onSuccess: () => {
      showToast("Asset created successfully", "success")
      invalidateAssets()
      setIsFormOpen(false)
      setSelectedAsset(null)
    },
    onError: (error: any) => {
      showToast(error?.message || "Failed to create asset", "error")
    },
  })

  const updateAssetMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await fetch(`${API_URL}/assets/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err?.message || "Failed to update asset")
      }
    },
    onSuccess: () => {
      showToast("Asset updated successfully", "success")
      invalidateAssets()
      setIsFormOpen(false)
      setSelectedAsset(null)
    },
    onError: (error: any) => {
      showToast(error?.message || "Failed to update asset", "error")
    },
  })

  const assignAssetMutation = useMutation({
    mutationFn: async ({
      assetId,
      employeeId,
      notes,
    }: {
      assetId: string
      employeeId: string
      notes: string
    }) => {
      const response = await fetch(`${API_URL}/assets/${assetId}/assign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ employeeId, notes }),
      })
      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err?.message || "Failed to assign asset")
      }
    },
    onSuccess: () => {
      showToast("Asset assigned successfully", "success")
      invalidateAssets()
      setIsAssignModalOpen(false)
      setSelectedAsset(null)
    },
    onError: (error: any) => {
      showToast(error?.message || "Failed to assign asset", "error")
    },
  })

  const returnAssetMutation = useMutation({
    mutationFn: async (assetId: string) => {
      const response = await fetch(`${API_URL}/assets/${assetId}/return`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err?.message || "Failed to return asset")
      }
    },
    onSuccess: () => {
      showToast("Asset returned successfully", "success")
      invalidateAssets()
    },
    onError: (error: any) => {
      showToast(error?.message || "Failed to return asset", "error")
    },
  })

  const handleSubmitAsset = async (assetData: any) => {
    if (selectedAsset) {
      await updateAssetMutation.mutateAsync({ id: selectedAsset.id, data: assetData })
    } else {
      await createAssetMutation.mutateAsync(assetData)
    }
  }

  const handleAssignAsset = async (employeeId: string, notes: string) => {
    if (!selectedAsset) return
    await assignAssetMutation.mutateAsync({
      assetId: selectedAsset.id,
      employeeId,
      notes,
    })
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
      assigned: list.filter((asset) => asset.status === "assigned").length,
      available: list.filter((asset) => asset.status === "available").length,
      maintenance: list.filter((asset) => asset.status === "maintenance").length,
    }
  }, [assetsQuery.data])

  const employees = employeesQuery.data ?? []

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Asset Management</h1>
                <p className="text-sm text-gray-500">Track hardware, software, and assignments.</p>
              </div>
              <Button
                onClick={() => {
                  setSelectedAsset(null)
                  setIsFormOpen(true)
                }}
                className="flex items-center"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Add Asset
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <p className="text-sm text-gray-500">Total Assets</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <p className="text-sm text-gray-500">Assigned</p>
                <p className="text-2xl font-bold text-blue-600">{stats.assigned}</p>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <p className="text-sm text-gray-500">Available</p>
                <p className="text-2xl font-bold text-green-600">{stats.available}</p>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <p className="text-sm text-gray-500">Maintenance</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.maintenance}</p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
              <div className="flex-1 relative">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search assets..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="w-full md:w-48">
                <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2">
                  <FunnelIcon className="h-5 w-5 text-gray-400" />
                  <select
                    className="w-full bg-transparent focus:outline-none text-sm text-gray-700"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <option value="">All Statuses</option>
                    <option value="available">Available</option>
                    <option value="assigned">Assigned</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="retired">Retired</option>
                  </select>
                </div>
              </div>
            </div>

            {assetsQuery.isLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
              </div>
            ) : (assetsQuery.data ?? []).length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                <p className="text-gray-500">No assets found matching your criteria.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(assetsQuery.data ?? []).map((asset) => (
                  <AssetCard
                    key={asset.id}
                    asset={asset}
                    onAssign={(a) => {
                      setSelectedAsset(a)
                      setIsAssignModalOpen(true)
                    }}
                    onReturn={handleReturnAsset}
                    onEdit={(a) => {
                      setSelectedAsset(a)
                      setIsFormOpen(true)
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          <AssetForm
            isOpen={isFormOpen}
            onClose={() => {
              setIsFormOpen(false)
              setSelectedAsset(null)
            }}
            onSubmit={handleSubmitAsset}
            initialData={selectedAsset || undefined}
          />

          <AssignmentModal
            isOpen={isAssignModalOpen}
            onClose={() => {
              setIsAssignModalOpen(false)
              setSelectedAsset(null)
            }}
            onAssign={handleAssignAsset}
            employees={employees}
          />
          <ConfirmDialog
            isOpen={isReturnDialogOpen}
            onClose={() => {
              setIsReturnDialogOpen(false)
              setAssetPendingReturn(null)
            }}
            onConfirm={confirmReturnAsset}
            title="Return asset"
            message={
              assetPendingReturn
                ? `Mark ${assetPendingReturn.name} as returned? This will make it available for reassignment.`
                : 'Mark this asset as returned?'
            }
            confirmText={returnAssetMutation.isPending ? "Returning..." : "Return"}
            cancelText="Keep assigned"
            loading={returnAssetMutation.isPending}
            type="warning"
          />
        </main>
      </div>
    </div>
  )
}
