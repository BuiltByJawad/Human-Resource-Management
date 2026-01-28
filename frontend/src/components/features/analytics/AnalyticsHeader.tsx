"use client"

import { ArrowPathIcon } from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/FormComponents'

interface AnalyticsHeaderProps {
  period: string
  onPeriodChange: (value: string) => void
  onRefresh: () => void
  isRefreshing: boolean
}

export function AnalyticsHeader({ period, onPeriodChange, onRefresh, isRefreshing }: AnalyticsHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Company Analytics</h1>
        <p className="mt-1 text-sm text-gray-500">Comprehensive overview of company workforce and performance.</p>
      </div>
      <div className="mt-4 md:mt-0 flex items-center space-x-3">
        <select
          value={period}
          onChange={(event) => onPeriodChange(event.target.value)}
          className="rounded-md border-gray-300 py-2 pl-3 pr-10 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
        >
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
          <option value="365">Last year</option>
        </select>
        <Button onClick={onRefresh} variant="secondary" className="flex items-center gap-2">
          <ArrowPathIcon className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
    </div>
  )
}
