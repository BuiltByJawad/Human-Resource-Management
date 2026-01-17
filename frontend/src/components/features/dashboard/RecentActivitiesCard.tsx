import { Card } from '@/components/ui/FormComponents'
import type { RecentActivity } from '@/services/dashboard/types'

interface RecentActivitiesCardProps {
  activities: RecentActivity[]
  showSkeleton: boolean
  getActivityIcon: (type: string) => string
  getActivityTimestamp: (value: string) => string
}

export function RecentActivitiesCard({ activities, showSkeleton, getActivityIcon, getActivityTimestamp }: RecentActivitiesCardProps) {
  return (
    <Card title="Recent Activities" className="lg:col-span-2">
      <div className="space-y-4">
        {showSkeleton ? (
          Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex items-start space-x-3 p-3 rounded-lg animate-pulse">
              <div className="w-8 h-8 rounded-full bg-gray-200" />
              <div className="flex-1 min-w-0 space-y-2">
                <div className="h-3 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-100 rounded w-1/3" />
              </div>
            </div>
          ))
        ) : activities.length === 0 ? (
          <p className="text-sm text-gray-500">No recent activity yet.</p>
        ) : (
          activities.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg">
              <div className="text-2xl">{getActivityIcon(activity.type)}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900">
                  <span className="font-medium">{activity.employee}</span> {activity.description}
                </p>
                <p className="text-xs text-gray-500">{getActivityTimestamp(activity.timestamp)}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  )
}
