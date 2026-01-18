import { ArrowLeftIcon, ArrowPathIcon, PlusIcon } from '@heroicons/react/24/outline'

interface ShiftsHeaderProps {
  onBack: () => void
  onRefresh: () => void
  onCreate: () => void
}

export const ShiftsHeader = ({ onBack, onRefresh, onCreate }: ShiftsHeaderProps) => (
  <>
    <div className="mb-6">
      <button
        onClick={onBack}
        className="inline-flex items-center justify-center p-2 rounded-full hover:bg-gray-200 transition-colors text-gray-500 hover:text-gray-900"
        aria-label="Go back"
      >
        <ArrowLeftIcon className="h-6 w-6" />
      </button>
    </div>

    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Shift Scheduling</h1>
        <p className="mt-1 text-sm text-gray-500">Manage employee shifts and schedules</p>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onRefresh}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <ArrowPathIcon className="h-4 w-4" />
          Refresh
        </button>
        <button
          onClick={onCreate}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <PlusIcon className="h-5 w-5" />
          Schedule Shift
        </button>
      </div>
    </div>
  </>
)
