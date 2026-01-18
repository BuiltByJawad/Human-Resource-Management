"use client"

import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { Select } from '@/components/ui/CustomSelect'

interface BurnoutHeaderProps {
  period: number
  onPeriodChange: (value: string) => void
  onBack: () => void
}

export function BurnoutHeader({ period, onPeriodChange, onBack }: BurnoutHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
      <div className="flex items-start space-x-4">
        <button
          onClick={onBack}
          className="mt-1 p-2 rounded-full hover:bg-gray-200 transition-colors text-gray-500 hover:text-gray-900"
          aria-label="Go back"
        >
          <ArrowLeftIcon className="h-6 w-6" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Burnout Risk Analytics</h1>
          <p className="mt-1 text-sm text-gray-500">Monitor employee wellbeing and identify at-risk team members.</p>
        </div>
      </div>
      <div className="mt-4 md:mt-0 w-48">
        <Select
          value={period.toString()}
          onChange={onPeriodChange}
          options={[
            { value: '7', label: 'Last 7 days' },
            { value: '30', label: 'Last 30 days' },
            { value: '60', label: 'Last 60 days' },
            { value: '90', label: 'Last 90 days' },
          ]}
        />
      </div>
    </div>
  )
}
