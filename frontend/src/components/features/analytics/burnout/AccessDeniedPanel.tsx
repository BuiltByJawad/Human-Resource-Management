"use client"

import { ArrowLeftIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'

interface AccessDeniedPanelProps {
  onBack: () => void
}

export function AccessDeniedPanel({ onBack }: AccessDeniedPanelProps) {
  return (
    <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-200">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
        <ExclamationTriangleIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
      </div>
      <h3 className="mt-2 text-sm font-semibold text-gray-900">Access Denied</h3>
      <p className="mt-1 text-sm text-gray-500">You do not have permission to view this page.</p>
      <div className="mt-6">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          <ArrowLeftIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
          Go back to Dashboard
        </button>
      </div>
    </div>
  )
}
