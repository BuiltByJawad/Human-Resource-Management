"use client"

import dynamic from "next/dynamic"
import { FunnelIcon, MagnifyingGlassIcon, PlusIcon } from "@heroicons/react/24/outline"

import { Button } from "@/components/ui/FormComponents"
import { AssetCard } from "@/components/features/assets/AssetCard"
const AssetForm = dynamic(() => import("@/components/features/assets/AssetForm").then((mod) => mod.AssetForm), {
  ssr: false,
})
const AssignmentModal = dynamic(
  () => import("@/components/features/assets/AssignmentModal").then((mod) => mod.AssignmentModal),
  { ssr: false }
)
const ConfirmDialog = dynamic(() => import("@/components/ui/ConfirmDialog").then((mod) => mod.ConfirmDialog), {
  ssr: false,
})
import type { Asset } from "@/services/assets/types"
import { useAssetsPage } from "@/hooks/useAssetsPage"
import type { Employee } from "@/services/employees/types"

interface AssetsPageClientProps {
  initialAssets?: Asset[]
  initialEmployees?: Employee[]
}

export function AssetsPageClient({
  initialAssets = [],
  initialEmployees = [],
}: AssetsPageClientProps) {
  const {
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
  } = useAssetsPage({ initialAssets, initialEmployees })

  const employees = employeesQuery.data ?? []

  return (
    <div className="p-4 md:p-6">
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
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2 border border-gray-300 rounded-lg px-3 py-2">
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

      {isFormOpen && (
        <AssetForm
          isOpen={isFormOpen}
          onClose={() => {
            setIsFormOpen(false)
            setSelectedAsset(null)
          }}
          onSubmit={handleSubmitAsset}
          initialData={selectedAsset || undefined}
        />
      )}

      {isAssignModalOpen && (
        <AssignmentModal
          isOpen={isAssignModalOpen}
          onClose={() => {
            setIsAssignModalOpen(false)
            setSelectedAsset(null)
          }}
          onAssign={handleAssignAsset}
          employees={employees}
        />
      )}
      {isReturnDialogOpen && (
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
      )}
    </div>
  )
}
