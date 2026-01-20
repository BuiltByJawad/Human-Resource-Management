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
          className="border border-slate-200/70 shadow-sm hover:shadow-lg transition-all duration-300 bg-white group overflow-hidden"
        >
          <CardContent className="p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-[0.2em]">{item.name}</p>
                <p className="text-3xl font-semibold text-slate-900 mt-3 tracking-tight">
                  {item.value}
                </p>
              </div>
              <div
                className={`h-11 w-11 rounded-2xl flex items-center justify-center border border-white/60 shadow-sm ${item.bg}`}
              >
                <item.icon className={`h-5 w-5 ${item.color}`} aria-hidden="true" />
              </div>
            </div>
            <div className={`mt-5 h-1.5 w-16 rounded-full ${item.bg}`} />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
