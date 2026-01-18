import DashboardShell from '@/components/ui/DashboardShell'
import { Skeleton } from '@/components/ui/Skeleton'

export const AssetDetailsSkeleton = () => (
  <DashboardShell>
    <div className="p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <Skeleton className="h-4 w-24" />
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-4 w-1/4" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-3">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    </div>
  </DashboardShell>
)
