"use client"

import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'

export function EmptyState() {
  return (
    <div className="text-center py-20">
      <ExclamationTriangleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to load analytics</h3>
      <p className="text-gray-500">Please try refreshing the page or check your connection.</p>
    </div>
  )
}
