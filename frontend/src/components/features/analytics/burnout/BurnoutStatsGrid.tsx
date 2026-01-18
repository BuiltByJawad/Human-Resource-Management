"use client"

import { ChartBarIcon, ExclamationTriangleIcon, UserGroupIcon } from '@heroicons/react/24/outline'
import type { BurnoutSummary } from '@/services/analytics/burnout/types'

interface BurnoutStatsGridProps {
  summary: BurnoutSummary
}

export function BurnoutStatsGrid({ summary }: BurnoutStatsGridProps) {
  const stats = [
    { name: 'Total Employees', value: summary.totalEmployees, icon: UserGroupIcon, color: 'text-blue-600', bg: 'bg-blue-100' },
    { name: 'Critical Risk', value: summary.criticalRisk, icon: ExclamationTriangleIcon, color: 'text-red-600', bg: 'bg-red-100' },
    { name: 'High Risk', value: summary.highRisk, icon: ExclamationTriangleIcon, color: 'text-orange-600', bg: 'bg-orange-100' },
    { name: 'Avg Risk Score', value: summary.avgRiskScore.toFixed(1), icon: ChartBarIcon, color: 'text-purple-600', bg: 'bg-purple-100' },
  ]

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-4 mb-10">
      {stats.map((item) => (
        <div
          key={item.name}
          className="bg-white overflow-hidden shadow-sm rounded-xl border border-gray-100 hover:shadow-md transition-shadow"
        >
          <div className="p-5">
            <div className="flex items-center">
              <div className={`flex-shrink-0 rounded-md p-3 ${item.bg}`}>
                <item.icon className={`h-6 w-6 ${item.color}`} aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">{item.name}</dt>
                  <dd>
                    <div className="text-2xl font-bold text-gray-900">{item.value}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
