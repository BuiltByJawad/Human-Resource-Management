'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  HomeIcon,
  UsersIcon,
  BuildingOfficeIcon,
  ClipboardDocumentListIcon,
  ClockIcon,
  BanknotesIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  SparklesIcon,
  ShieldCheckIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon
} from '@heroicons/react/24/outline'

const navigation = [
  {
    label: 'Workspace',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
      { name: 'Employees', href: '/employees', icon: UsersIcon },
      { name: 'Departments', href: '/departments', icon: BuildingOfficeIcon },
      { name: 'Attendance', href: '/attendance', icon: ClockIcon },
      { name: 'Leave', href: '/leave', icon: ClipboardDocumentListIcon },
    ],
  },
  {
    label: 'Operations',
    items: [
      { name: 'Payroll', href: '/payroll', icon: BanknotesIcon },
      { name: 'Performance', href: '/performance', icon: SparklesIcon },
      { name: 'Reports', href: '/reports', icon: ChartBarIcon },
      { name: 'Compliance', href: '/documents', icon: ShieldCheckIcon },
    ],
  },
  {
    label: 'System',
    items: [{ name: 'Settings', href: '/settings', icon: Cog6ToothIcon }],
  },
]

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('sidebarCollapsed') === 'true'
    }
    return false
  })
  const pathname = usePathname()

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', isCollapsed.toString())
  }, [isCollapsed])

  const sidebarWidth = isCollapsed ? 'w-20' : 'w-72'

  const renderExpandedNavItem = (item: (typeof navigation)[number]['items'][number]) => {
    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
    return (
      <Link
        key={item.name}
        href={item.href}
        className={`flex items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium transition-all w-full ${
          isActive
            ? 'bg-white text-blue-600 shadow-sm'
            : 'text-slate-300 hover:bg-white/10 hover:text-white'
        }`}
      >
        <item.icon className={`h-5 w-5 flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
        <span className="whitespace-nowrap">
          {item.name}
        </span>
      </Link>
    )
  }

  const renderCollapsedNavItem = (item: (typeof navigation)[number]['items'][number]) => {
    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)

    return (
      <Link
        key={item.name}
        href={item.href}
        className="flex items-center justify-center w-12 h-10 mx-auto rounded-2xl text-slate-300 hover:bg-white/10 hover:text-white"
      >
        <item.icon className={`h-5 w-5 flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
        <span className="sr-only">{item.name}</span>
      </Link>
    )
  }

  return (
    <aside
      className={`hidden md:flex relative ${sidebarWidth} bg-slate-900/95 text-white min-h-screen transition-all duration-300 flex-col border-r border-slate-800/60 shadow-xl z-20`}
    >
      <div className="flex items-center justify-between px-4 py-5 border-b border-white/10">
        <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center w-full' : ''}`}>
          <div className="h-10 w-10 rounded-2xl bg-blue-600 flex items-center justify-center font-semibold text-lg">
            HR
          </div>
          <div
            className={`transition-all duration-200 origin-left ${
              isCollapsed
                ? 'opacity-0 max-w-0 overflow-hidden -translate-x-1'
                : 'opacity-100 max-w-[200px] translate-x-0'
            }`}
          >
            <p className="text-base font-semibold tracking-tight">NovaHR Suite</p>
            <p className="text-xs text-slate-400">Human Resource OS</p>
          </div>
        </div>
      </div>

      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute top-6 -right-3 z-10 p-2 rounded-full bg-white text-slate-700 shadow-md hover:shadow-lg transition-all"
        aria-label="Toggle sidebar"
      >
        {isCollapsed ? (
          <ChevronDoubleRightIcon className="h-4 w-4" />
        ) : (
          <ChevronDoubleLeftIcon className="h-4 w-4" />
        )}
      </button>

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {navigation.map((section) => (
          <div key={section.label}>
            {!isCollapsed && (
              <p className="text-xs uppercase tracking-widest text-slate-500 mb-3">{section.label}</p>
            )}
            <div className="space-y-2">
              {isCollapsed 
                ? section.items.map(renderCollapsedNavItem)
                : section.items.map(renderExpandedNavItem)
              }
            </div>
          </div>
        ))}
      </div>

      <div className="px-4 py-5 border-t border-white/10">
        <div
          className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} rounded-2xl bg-white/5 p-3`}
        >
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center font-semibold">
            JD
          </div>
          {!isCollapsed && (
            <div>
              <p className="text-sm font-semibold">John Doe</p>
              <p className="text-xs text-slate-400">System Administrator</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}