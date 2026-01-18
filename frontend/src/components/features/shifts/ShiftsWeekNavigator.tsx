import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'

interface ShiftsWeekNavigatorProps {
  title: string
  subtitle: string
  onPrev: () => void
  onNext: () => void
}

export const ShiftsWeekNavigator = ({
  title,
  subtitle,
  onPrev,
  onNext,
}: ShiftsWeekNavigatorProps) => (
  <div className="flex items-center justify-between mb-6 bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3">
    <button onClick={onPrev} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
      <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
    </button>
    <div className="text-center">
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      <p className="text-sm text-gray-500">{subtitle}</p>
    </div>
    <button onClick={onNext} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
      <ChevronRightIcon className="h-5 w-5 text-gray-600" />
    </button>
  </div>
)
