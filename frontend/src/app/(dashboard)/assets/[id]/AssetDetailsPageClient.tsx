'use client'

import dynamic from 'next/dynamic'
import { useParams, useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/ToastProvider'
const AssignmentModal = dynamic(
  () => import('@/components/features/assets/AssignmentModal').then((mod) => mod.AssignmentModal),
  { ssr: false }
)
const MaintenanceModal = dynamic(
  () => import('@/components/features/assets/MaintenanceModal').then((mod) => mod.MaintenanceModal),
  { ssr: false }
)
import {
  AssetDetailsHeader,
  AssetDetailsSkeleton,
  AssetDetailsTabs,
  CurrentAssignmentCard,
} from '@/components/features/assets/details'
import type { Asset } from '@/services/assets/types'
import type { Employee } from '@/services/employees/types'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { handleCrudError } from '@/lib/apiError'
const ConfirmDialog = dynamic(() => import('@/components/ui/ConfirmDialog').then((mod) => mod.ConfirmDialog), {
  ssr: false,
})
import { useAssetDetails } from '@/hooks/useAssetDetails'

interface AssetDetailsPageClientProps {
  initialAsset: Asset | null
  initialEmployees: Employee[]
}

export function AssetDetailsPageClient({ initialAsset, initialEmployees }: AssetDetailsPageClientProps) {
  const params = useParams()
  const router = useRouter()
  const { showToast } = useToast()

  const assetId = (params?.id ?? '') as string
  const {
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
    returnMutation,
    currentAssignment,
    handleReturn,
    confirmReturn,
    handleAssign,
    handleMaintenanceSubmit,
  } = useAssetDetails({ assetId, initialAsset, initialEmployees })

  if (assetQuery.isLoading) {
    return <AssetDetailsSkeleton />
  }

  if (assetQuery.isError) {
    handleCrudError({ error: assetQuery.error, resourceLabel: 'Asset details', showToast })
    return (
      <div className="flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <p className="text-gray-700 font-medium">Unable to load asset details.</p>
          <button
            onClick={() => router.push('/assets')}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Assets
          </button>
        </div>
      </div>
    )
  }

  const asset = assetQuery.data
  if (!asset) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="text-center text-gray-600">
          Asset not found.
          <div className="mt-3">
            <button
              onClick={() => router.push('/assets')}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Back to Assets
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="p-4 md:p-6">
        <div className="max-w-5xl mx-auto space-y-6">
            <button
              onClick={() => router.back()}
              className="flex items-center text-sm text-gray-500 hover:text-gray-700"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-1" />
              Back to Assets
            </button>

            <AssetDetailsHeader
              asset={asset}
              onAssign={() => setIsAssignModalOpen(true)}
              onReturn={handleReturn}
              returnLoading={returnMutation.isPending}
            />

            {currentAssignment && <CurrentAssignmentCard assignment={currentAssignment} />}

            <AssetDetailsTabs
              activeTab={activeTab}
              onTabChange={setActiveTab}
              assignments={asset.assignments}
              maintenanceLogs={asset.maintenance ?? []}
              onAddMaintenance={() => setIsMaintenanceModalOpen(true)}
            />
        </div>
      </div>

      {isAssignModalOpen && (
        <AssignmentModal
          isOpen={isAssignModalOpen}
          onClose={() => setIsAssignModalOpen(false)}
          onAssign={handleAssign}
          employees={employeesQuery.data || []}
        />
      )}

      {isMaintenanceModalOpen && (
        <MaintenanceModal
          isOpen={isMaintenanceModalOpen}
          onClose={() => setIsMaintenanceModalOpen(false)}
          onSubmit={handleMaintenanceSubmit}
        />
      )}
      {isReturnDialogOpen && (
        <ConfirmDialog
          isOpen={isReturnDialogOpen}
          onClose={() => setIsReturnDialogOpen(false)}
          onConfirm={confirmReturn}
          title="Return asset"
          message="Mark this asset as returned? It will be available for reassignment."
          confirmText={returnMutation.isPending ? 'Returning...' : 'Return'}
          cancelText="Keep assigned"
          loading={returnMutation.isPending}
          type="warning"
        />
      )}
    </>
  )
}
