import { PlusIcon, PlayIcon } from '@heroicons/react/24/outline'

interface ComplianceHeaderProps {
  onRunCheck: () => void
  onAddRule: () => void
  disabled?: boolean
}

export function ComplianceHeader({ onRunCheck, onAddRule, disabled }: ComplianceHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Compliance Sentinel</h1>
        <p className="text-sm text-gray-500">Monitor labor law compliance and violations</p>
      </div>
      <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
        <button
          onClick={onRunCheck}
          disabled={disabled}
          className="inline-flex w-full items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-60 sm:w-auto"
        >
          <PlayIcon className="-ml-1 mr-2 h-5 w-5 text-gray-500" />
          Run Check
        </button>
        <button
          onClick={onAddRule}
          className="inline-flex w-full items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:w-auto"
        >
          <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
          Add Rule
        </button>
      </div>
    </div>
  )
}
