"use client"

import { Button } from '@/components/ui/FormComponents'
import { PlusIcon } from '@heroicons/react/24/outline'

interface PerformanceHeaderProps {
  title: string
  subtitle: string
  canManageCycles: boolean
  onCreateCycle: () => void
}

export function PerformanceHeader({ title, subtitle, canManageCycles, onCreateCycle }: PerformanceHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{title}</h1>
        <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
      </div>
      {canManageCycles && (
        <div className="mt-4 md:mt-0">
          <Button onClick={onCreateCycle} className="shadow-lg shadow-blue-500/30">
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
            New Review Cycle
          </Button>
        </div>
      )}
    </div>
  )
}
