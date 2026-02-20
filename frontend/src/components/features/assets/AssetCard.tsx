import { ComputerDesktopIcon, DevicePhoneMobileIcon, UserCircleIcon, WrenchScrewdriverIcon } from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/FormComponents'
import type { Asset } from '@/services/assets/types'

interface AssetCardProps {
  asset: Asset
  onAssign: (asset: Asset) => void
  onReturn: (asset: Asset) => void
  onEdit: (asset: Asset) => void
}

export const AssetCard = ({ asset, onAssign, onReturn, onEdit }: AssetCardProps) => {
  const currentAssignment = (asset.assignments ?? []).find((assignment) => !assignment.returnedDate)

  const getIcon = () => {
    const type = typeof asset.type === 'string' ? asset.type : ''
    switch (type.toLowerCase()) {
      case 'laptop':
        return <ComputerDesktopIcon className="h-8 w-8 text-blue-500" />
      case 'mobile':
        return <DevicePhoneMobileIcon className="h-8 w-8 text-green-500" />
      default:
        return <WrenchScrewdriverIcon className="h-8 w-8 text-gray-500" />
    }
  }

  const getStatusColor = () => {
    switch (asset.status) {
      case 'available':
        return 'bg-green-100 text-green-800'
      case 'assigned':
        return 'bg-blue-100 text-blue-800'
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800'
      case 'retired':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 bg-gray-50 rounded-lg">{getIcon()}</div>
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor()}`}>
          {asset.status.toUpperCase()}
        </span>
      </div>

      <h3 className="font-semibold text-gray-900 mb-1">{asset.name}</h3>
      <p className="text-sm text-gray-500 mb-4 font-mono">{asset.serialNumber}</p>

      {currentAssignment && (
        <div className="flex items-center mb-4 p-2 bg-blue-50 rounded-lg">
          <UserCircleIcon className="h-5 w-5 text-blue-600 mr-2" />
          <div className="text-xs">
            <p className="font-medium text-blue-900">
              {currentAssignment.employee.firstName} {currentAssignment.employee.lastName}
            </p>
            <p className="text-blue-700">{currentAssignment.employee.employeeNumber}</p>
          </div>
        </div>
      )}

      <div className="flex space-x-2 mt-auto pt-4 border-t border-gray-100">
        {asset.status === 'available' && (
          <Button onClick={() => onAssign(asset)} variant="primary" size="sm" className="flex-1">
            Assign
          </Button>
        )}
        {asset.status === 'assigned' && (
          <Button onClick={() => onReturn(asset)} variant="warning" size="sm" className="flex-1">
            Return
          </Button>
        )}
        <Button onClick={() => onEdit(asset)} variant="outline" size="sm">
          Edit
        </Button>
      </div>
    </div>
  )
}
