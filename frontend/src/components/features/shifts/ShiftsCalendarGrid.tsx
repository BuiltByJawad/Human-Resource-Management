import { format } from 'date-fns'
import type { Shift } from '@/services/shifts/types'
import { ClockIcon, MapPinIcon } from '@heroicons/react/24/outline'

interface ShiftsCalendarGridProps {
  weekDays: Date[]
  shiftsByDay: Record<string, Shift[]>
  shiftTypeColors: Record<string, string>
  formatTime: (value: string) => string
}

export const ShiftsCalendarGrid = ({
  weekDays,
  shiftsByDay,
  shiftTypeColors,
  formatTime,
}: ShiftsCalendarGridProps) => (
  <div className="grid grid-cols-7 gap-2">
    {weekDays.map((day) => {
      const dateKey = format(day, 'yyyy-MM-dd')
      const dayShifts = shiftsByDay[dateKey] || []
      const isToday = new Date().toDateString() === day.toDateString()

      return (
        <div
          key={dateKey}
          className={`bg-white rounded-xl border shadow-sm min-h-[200px] ${
            isToday ? 'border-blue-300 ring-2 ring-blue-100' : 'border-gray-100'
          }`}
        >
          <div
            className={`px-3 py-2 border-b ${
              isToday ? 'bg-blue-50 border-blue-100' : 'bg-gray-50 border-gray-100'
            }`}
          >
            <p className="text-xs font-medium text-gray-500">
              {day.toLocaleDateString('en-US', { weekday: 'short' })}
            </p>
            <p className={`text-lg font-bold ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
              {day.getDate()}
            </p>
          </div>
          <div className="p-2 space-y-2">
            {dayShifts.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">No shifts</p>
            ) : (
              dayShifts.map((shift) => (
                <div
                  key={shift.id}
                  className={`p-2 rounded-lg border text-xs ${
                    shiftTypeColors[shift.type] || 'bg-gray-100 text-gray-800 border-gray-200'
                  }`}
                >
                  <p className="font-semibold truncate">
                    {shift.employee?.firstName} {shift.employee?.lastName}
                  </p>
                  <div className="flex items-center gap-1 mt-1 text-xs opacity-80">
                    <ClockIcon className="h-3 w-3" />
                    {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
                  </div>
                  {shift.location && (
                    <div className="flex items-center gap-1 mt-0.5 text-xs opacity-80">
                      <MapPinIcon className="h-3 w-3" />
                      {shift.location}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )
    })}
  </div>
)
