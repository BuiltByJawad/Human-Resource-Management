"use client"

interface TimeTrackingTabsProps {
  activeTab: 'projects' | 'timesheet'
  onChange: (tab: 'projects' | 'timesheet') => void
}

export function TimeTrackingTabs({ activeTab, onChange }: TimeTrackingTabsProps) {
  return (
    <div className="flex gap-2 mb-6 border-b border-gray-200">
      <button
        onClick={() => onChange('projects')}
        className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${activeTab === 'projects'
          ? 'border-blue-600 text-blue-600'
          : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
      >
        Projects
      </button>
      <button
        onClick={() => onChange('timesheet')}
        className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${activeTab === 'timesheet'
          ? 'border-blue-600 text-blue-600'
          : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
      >
        Timesheets
      </button>
    </div>
  )
}
