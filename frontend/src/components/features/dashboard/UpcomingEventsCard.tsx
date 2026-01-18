import { Card } from '@/components/ui/FormComponents'
import type { UpcomingEvent } from '@/services/dashboard/types'

interface UpcomingEventsCardProps {
  events: UpcomingEvent[]
  showSkeleton: boolean
  getEventIcon: (type: string) => string
}

export function UpcomingEventsCard({ events, showSkeleton, getEventIcon }: UpcomingEventsCardProps) {
  return (
    <Card title="Upcoming Events">
      <div className="space-y-4">
        {showSkeleton ? (
          Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="flex items-start space-x-3 p-3 rounded-lg animate-pulse">
              <div className="w-8 h-8 rounded-full bg-gray-200" />
              <div className="flex-1 min-w-0 space-y-2">
                <div className="h-3 bg-gray-200 rounded w-2/3" />
                <div className="h-3 bg-gray-100 rounded w-1/3" />
              </div>
            </div>
          ))
        ) : events.length === 0 ? (
          <p className="text-sm text-gray-500">No upcoming events in the next 30 days.</p>
        ) : (
          events.map((event) => (
            <div key={event.id} className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg">
              <div className="text-2xl">{getEventIcon(event.type)}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{event.title}</p>
                <p className="text-xs text-gray-500">{event.date}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  )
}
