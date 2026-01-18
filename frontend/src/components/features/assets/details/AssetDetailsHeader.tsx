import { CalendarIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline'
import type { Asset } from '@/services/assets/types'

interface AssetDetailsHeaderProps {
  asset: Asset
  onAssign: () => void
  onReturn: () => void
  returnLoading: boolean
}

const getStatusColor = (status: Asset['status']) => {
  switch (status) {
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

export const AssetDetailsHeader = ({ asset, onAssign, onReturn, returnLoading }: AssetDetailsHeaderProps) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-bold text-gray-900">{asset.name}</h1>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(asset.status)}`}>
            {asset.status.toUpperCase()}
          </span>
        </div>
        <p className="text-gray-500 font-mono">{asset.serialNumber}</p>
      </div>
      <div className="flex gap-2">
        {asset.status === 'available' && (
          <button
            onClick={onAssign}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
          >
            Assign Asset
          </button>
        )}
        {asset.status === 'assigned' && (
          <button
            onClick={onReturn}
            className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 text-sm font-medium"
            disabled={returnLoading}
          >
            {returnLoading ? 'Returning...' : 'Return Asset'}
          </button>
        )}
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 pt-6 border-t border-gray-100">
      <div>
        <p className="text-sm text-gray-500 mb-1">Type</p>
        <p className="font-medium text-gray-900">{asset.type}</p>
      </div>
      <div>
        <p className="text-sm text-gray-500 mb-1">Purchase Date</p>
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-4 w-4 text-gray-400" />
          <p className="font-medium text-gray-900">{new Date(asset.purchaseDate).toLocaleDateString()}</p>
        </div>
      </div>
      <div>
        <p className="text-sm text-gray-500 mb-1">Purchase Price</p>
        <div className="flex items-center gap-2">
          <CurrencyDollarIcon className="h-4 w-4 text-gray-400" />
          <p className="font-medium text-gray-900">
            {asset.purchasePrice ? `$${asset.purchasePrice.toLocaleString()}` : '-'}
          </p>
        </div>
      </div>
    </div>
  </div>
)
