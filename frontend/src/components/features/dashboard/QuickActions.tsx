import { UsersIcon, BuildingOfficeIcon, ClockIcon, ChartBarIcon } from '@heroicons/react/24/outline'

interface QuickActionsProps {
  onNavigate: (path: string) => void
}

export function QuickActions({ onNavigate }: QuickActionsProps) {
  return (
    <div className="mt-8">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button
          className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow text-center"
          type="button"
          onClick={() => onNavigate('/employees?new=1')}
        >
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
            <UsersIcon className="h-6 w-6 text-blue-600" />
          </div>
          <span className="text-sm font-medium text-gray-900">Add Employee</span>
        </button>
        <button
          className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow text-center"
          type="button"
          onClick={() => onNavigate('/departments')}
        >
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
            <BuildingOfficeIcon className="h-6 w-6 text-green-600" />
          </div>
          <span className="text-sm font-medium text-gray-900">Add Department</span>
        </button>
        <button
          className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow text-center"
          type="button"
          onClick={() => onNavigate('/payroll')}
        >
          <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
            <ClockIcon className="h-6 w-6 text-yellow-600" />
          </div>
          <span className="text-sm font-medium text-gray-900">Process Payroll</span>
        </button>
        <button
          className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow text-center"
          type="button"
          onClick={() => onNavigate('/reports')}
        >
          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
            <ChartBarIcon className="h-6 w-6 text-purple-600" />
          </div>
          <span className="text-sm font-medium text-gray-900">View Reports</span>
        </button>
      </div>
    </div>
  )
}
