"use client"

import type { TabType } from '@/hooks/useReportsPage'

interface ReportsTabsProps {
  activeTab: TabType
  onChange: (tab: TabType) => void
}

const TABS: Array<{ id: TabType; name: string; description: string }> = [
  { id: 'overview', name: 'Overview', description: 'Dashboard metrics' },
  { id: 'employees', name: 'Employees', description: 'Employee directory' },
  { id: 'attendance', name: 'Attendance', description: 'Clock records' },
  { id: 'leave', name: 'Leave', description: 'Leave requests' },
  { id: 'payroll', name: 'Payroll', description: 'Salary records' },
  { id: 'schedules', name: 'Schedules', description: 'Scheduled exports' },
]

export function ReportsTabs({ activeTab, onChange }: ReportsTabsProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6 overflow-hidden">
      <nav className="flex overflow-x-auto" aria-label="Report tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            disabled={activeTab === tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex-1 min-w-fit px-6 py-4 text-sm font-medium transition-all duration-200 border-b-2 ${
              activeTab === tab.id
                ? 'border-blue-500 text-blue-600 bg-blue-50'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <div className="flex flex-col items-center space-y-1">
              <span>{tab.name}</span>
              <span className="text-xs text-gray-500 font-normal">{tab.description}</span>
            </div>
          </button>
        ))}
      </nav>
    </div>
  )
}
