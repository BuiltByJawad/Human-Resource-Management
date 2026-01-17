"use client"

import { BanknotesIcon, ClockIcon, DocumentTextIcon, UserGroupIcon } from '@heroicons/react/24/outline'

interface OverviewStatsProps {
  totalEmployees?: number
  presentToday?: number
  pendingLeaves?: number
  monthlyPayroll?: number
}

const cards = [
  { title: 'Total Employees', icon: UserGroupIcon, key: 'totalEmployees' as const },
  { title: 'Present Today', icon: ClockIcon, key: 'presentToday' as const },
  { title: 'Pending Leaves', icon: DocumentTextIcon, key: 'pendingLeaves' as const },
  { title: 'Monthly Payroll', icon: BanknotesIcon, key: 'monthlyPayroll' as const },
]

export function OverviewStats({ totalEmployees = 0, presentToday = 0, pendingLeaves = 0, monthlyPayroll = 0 }: OverviewStatsProps) {
  const values = { totalEmployees, presentToday, pendingLeaves, monthlyPayroll }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
      {cards.map(({ title, icon: Icon, key }) => (
        <div key={key} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 transition-all duration-200 hover:shadow-md">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <Icon className="h-5 w-5" />
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {key === 'monthlyPayroll' ? `$${Number(values[key]).toLocaleString()}` : Number(values[key]).toLocaleString()}
          </p>
        </div>
      ))}
    </div>
  )
}
