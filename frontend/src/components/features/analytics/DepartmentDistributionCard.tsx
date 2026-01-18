"use client"

import { ChartBarIcon } from '@heroicons/react/24/outline'
import type { DepartmentStat } from '@/services/analytics/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface DepartmentDistributionCardProps {
  deptStats: DepartmentStat[]
  totalEmployees: number
}

export function DepartmentDistributionCard({ deptStats, totalEmployees }: DepartmentDistributionCardProps) {
  return (
    <Card className="lg:col-span-2 border-none shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <ChartBarIcon className="w-5 h-5 text-blue-600" />
          Department Distribution
        </CardTitle>
        <CardDescription>Workforce breakdown by department</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-5">
          {deptStats.length === 0 ? (
            <p className="text-center py-10 text-gray-500 italic">No department data available</p>
          ) : (
            deptStats.map((dept) => {
              const percentage = totalEmployees > 0 ? (dept._count.employees / totalEmployees) * 100 : 0
              return (
                <div key={dept.id}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-sm font-semibold text-gray-700">{dept.name}</span>
                    <span className="text-xs font-bold text-gray-500">
                      {dept._count.employees} employees ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3">
                    <div
                      className="bg-blue-600 h-3 rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })
          )}
        </div>
      </CardContent>
    </Card>
  )
}
