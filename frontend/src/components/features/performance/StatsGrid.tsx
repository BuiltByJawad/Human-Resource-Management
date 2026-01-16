"use client"

import type { ReactNode } from 'react'

export interface StatItem {
  name: string
  value: string | number
  color: string
  bg: string
  icon?: ReactNode
}

interface StatsGridProps {
  stats: StatItem[]
}

export function StatsGrid({ stats }: StatsGridProps) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-10">
      {stats.map((item) => (
        <div
          key={item.name}
          className="bg-white overflow-hidden shadow-sm rounded-xl border border-gray-100 hover:shadow-md transition-shadow"
        >
          <div className="p-5">
            <div className="flex items-center">
              {item.icon ? (
                <div className={`flex-shrink-0 rounded-md p-3 ${item.bg}`}>{item.icon}</div>
              ) : (
                <div className={`flex-shrink-0 rounded-md p-3 ${item.bg}`}>
                  <span className={`text-xl font-semibold ${item.color}`}>•</span>
                </div>
              )}
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
