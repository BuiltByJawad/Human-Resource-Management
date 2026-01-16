"use client"

import type { TabKey } from '@/hooks/usePerformancePage'

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: 'active', label: 'Active Cycles' },
  { key: 'past', label: 'Past Reviews' },
  { key: 'team', label: 'Team Overview' },
]

interface PerformanceTabsProps {
  activeTab: TabKey
  onChange: (tab: TabKey) => void
}

export function PerformanceTabs({ activeTab, onChange }: PerformanceTabsProps) {
  return (
    <div className="border-b border-gray-200">
      <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === tab.key
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  )
}
