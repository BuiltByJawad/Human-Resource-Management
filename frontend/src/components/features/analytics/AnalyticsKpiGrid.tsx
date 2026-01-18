"use client"

import {
  ArrowTrendingDownIcon,
  CurrencyDollarIcon,
  UserPlusIcon,
  UsersIcon,
} from '@heroicons/react/24/outline'
import type { DashboardMetrics } from '@/services/analytics/types'
import { Card, CardContent } from '@/components/ui/card'

interface AnalyticsKpiGridProps {
  metrics: DashboardMetrics | null | undefined
}

const kpis = (metrics: DashboardMetrics | null | undefined) => [
  {
    name: 'Total Employees',
    value: metrics?.totalEmployees ?? 0,
    icon: UsersIcon,
    color: 'text-blue-600',
    bg: 'bg-blue-100',
  },
  {
    name: 'Active Employees',
    value: metrics?.activeEmployees ?? 0,
    icon: UsersIcon,
    color: 'text-green-600',
    bg: 'bg-green-100',
  },
  {
    name: 'New Hires',
    value: metrics?.newHires ?? 0,
    icon: UserPlusIcon,
    color: 'text-purple-600',
    bg: 'bg-purple-100',
  },
  {
    name: 'Turnover Rate',
    value: `${metrics?.turnoverRate ?? 0}%`,
    icon: ArrowTrendingDownIcon,
    color: 'text-orange-600',
    bg: 'bg-orange-100',
  },
  {
    name: 'Avg. Monthly Salary',
    value: `$${(metrics?.avgSalary ?? 0).toLocaleString()}`,
    icon: CurrencyDollarIcon,
    color: 'text-emerald-600',
    bg: 'bg-emerald-100',
  },
]

export function AnalyticsKpiGrid({ metrics }: AnalyticsKpiGridProps) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 mb-10">
      {kpis(metrics).map((item) => (
        <Card
          key={item.name}
          className="border-none shadow-md hover:shadow-lg transition-all duration-300 bg-white group"
        >
          <CardContent className="p-6">
            <div className="flex flex-col space-y-4">
              <div className={`p-3 rounded-xl w-fit transition-transform group-hover:scale-110 duration-300 ${item.bg}`}>
                <item.icon className={`h-6 w-6 ${item.color}`} aria-hidden="true" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{item.name}</p>
                <p className="text-2xl font-black text-gray-900 mt-1">{item.value}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
