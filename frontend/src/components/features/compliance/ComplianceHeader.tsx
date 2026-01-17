import { PlusIcon, PlayIcon } from '@heroicons/react/24/outline'

interface ComplianceHeaderProps {
  onRunCheck: () => void
  onAddRule: () => void
  disabled?: boolean
}

export function ComplianceHeader({ onRunCheck, onAddRule, disabled }: ComplianceHeaderProps) {
  return (
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Compliance Sentinel</h1>
        <p className="text-sm text-gray-500">Monitor labor law compliance and violations</p>
      </div>
      <div className="flex space-x-3">
        <button
          onClick={onRunCheck}
          disabled={disabled}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-60"
        >
          <PlayIcon className="-ml-1 mr-2 h-5 w-5 text-gray-500" />
          Run Check
        </button>
        <button
          onClick={onAddRule}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
          Add Rule
        </button>
      </div>
    </div>
  )
}
