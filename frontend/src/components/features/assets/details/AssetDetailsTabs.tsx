import { WrenchScrewdriverIcon } from '@heroicons/react/24/outline'
import type { AssetAssignment, MaintenanceLog } from '@/services/assets/types'
import { AssetHistoryTimeline } from './AssetHistoryTimeline'
import { MaintenanceTable } from './MaintenanceTable'

interface AssetDetailsTabsProps {
  activeTab: 'history' | 'maintenance'
  onTabChange: (tab: 'history' | 'maintenance') => void
  assignments: AssetAssignment[]
  maintenanceLogs: MaintenanceLog[]
  onAddMaintenance: () => void
}

export const AssetDetailsTabs = ({
  activeTab,
  onTabChange,
  assignments,
  maintenanceLogs,
  onAddMaintenance,
}: AssetDetailsTabsProps) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
    <div className="flex border-b border-gray-200">
      <button
        onClick={() => onTabChange('history')}
        className={`flex-1 px-6 py-4 text-sm font-medium text-center border-b-2 transition-colors ${
          activeTab === 'history'
            ? 'border-blue-500 text-blue-600 bg-blue-50/50'
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
        }`}
      >
        Assignment History
      </button>
      <button
        onClick={() => onTabChange('maintenance')}
        className={`flex-1 px-6 py-4 text-sm font-medium text-center border-b-2 transition-colors ${
          activeTab === 'maintenance'
            ? 'border-blue-500 text-blue-600 bg-blue-50/50'
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
        }`}
      >
        Maintenance Logs
      </button>
    </div>

    <div className="p-6">
      {activeTab === 'history' ? (
        <div className="space-y-6">
          <AssetHistoryTimeline assignments={assignments} />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={onAddMaintenance}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center"
            >
              <WrenchScrewdriverIcon className="h-4 w-4 mr-1" />
              Add Maintenance Log
            </button>
          </div>
          <MaintenanceTable logs={maintenanceLogs} />
        </div>
      )}
    </div>
  </div>
)
