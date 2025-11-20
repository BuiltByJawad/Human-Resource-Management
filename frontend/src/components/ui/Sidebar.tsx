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

function useSidebarState() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    // Check if the class was set by the inline script in layout
    const hasClass = document.documentElement.classList.contains('sidebar-collapsed')
    setIsCollapsed(hasClass)
    setIsMounted(true)
  }, [])

  const toggle = () => {
    setIsCollapsed(prev => {
      const newState = !prev
      localStorage.setItem('sidebarCollapsed', String(newState))
      // Update the class for consistency
      if (newState) {
        document.documentElement.classList.add('sidebar-collapsed')
      } else {
        document.documentElement.classList.remove('sidebar-collapsed')
      }
      return newState
    })
  }

  return { isCollapsed, isMounted, toggle }
}

export default function Sidebar() {
  const { toggle } = useSidebarState()
  const pathname = usePathname()

  const renderNavItem = (item: (typeof navigation)[number]['items'][number]) => {
    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)

    return (
      <Link
        key={item.name}
        href={item.href}
        className={`
          group flex items-center rounded-xl transition-all duration-200
          ${isActive
            ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20'
            : 'text-slate-400 hover:bg-white/5 hover:text-white'
          }
          w-full px-3 py-2.5 gap-3
          [.sidebar-collapsed_&]:w-10 [.sidebar-collapsed_&]:h-10 [.sidebar-collapsed_&]:justify-center [.sidebar-collapsed_&]:mx-auto [.sidebar-collapsed_&]:px-0
        `}
      >
        <item.icon className={`h-5 w-5 flex-shrink-0 transition-colors ${isActive ? 'text-white' : 'group-hover:text-white'}`} />
        <span className={`
          whitespace-nowrap font-medium text-sm transition-all duration-200 origin-left
          [.sidebar-collapsed_&]:hidden
        `}>
          {item.name}
        </span>
      </Link>
    )
  }

  return (
    <aside
      className={`
        hidden md:flex relative bg-[#0B1120] text-white min-h-screen transition-all duration-300 flex-col border-r border-white/5 shadow-2xl z-20
        w-72 [.sidebar-collapsed_&]:w-20
      `}
    >
      {/* Header */}
      <div className={`
        flex items-center px-6 border-b border-white/5 relative transition-all duration-300
        h-20 [.sidebar-collapsed_&]:h-32 [.sidebar-collapsed_&]:flex-col [.sidebar-collapsed_&]:justify-center [.sidebar-collapsed_&]:gap-4 [.sidebar-collapsed_&]:px-0
      `}>
        <div className={`flex items-center gap-4 transition-all duration-300 [.sidebar-collapsed_&]:justify-center [.sidebar-collapsed_&]:w-full`}>
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-900/20 flex-shrink-0">
            HR
          </div>
          <div
            className={`
              transition-all duration-300 origin-left
              opacity-100 max-w-[200px] translate-x-0
              [.sidebar-collapsed_&]:opacity-0 [.sidebar-collapsed_&]:max-w-0 [.sidebar-collapsed_&]:overflow-hidden [.sidebar-collapsed_&]:-translate-x-4 [.sidebar-collapsed_&]:hidden
            `}
          >
            <p className="text-base font-bold tracking-tight text-white">NovaHR</p>
            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Workspace</p>
          </div>
        </div>

        {/* Toggle Button */}
        <button
          onClick={toggle}
          className={`
            p-1.5 rounded-lg text-slate-400 hover:bg-white/10 hover:text-white transition-all duration-200
            absolute right-4
            [.sidebar-collapsed_&]:static [.sidebar-collapsed_&]:right-auto
          `}
          aria-label="Toggle sidebar"
        >
          <ChevronDoubleLeftIcon className="h-5 w-5 hidden [.sidebar-collapsed_&]:block rotate-180" />
          <ChevronDoubleLeftIcon className="h-5 w-5 block [.sidebar-collapsed_&]:hidden" />
        </button>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8 no-scrollbar">
        {navigation.map((section) => (
          <div key={section.label}>
            <p className={`
              text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-4 px-2
              [.sidebar-collapsed_&]:hidden
            `}>
              {section.label}
            </p>
            <div className="space-y-1">
              {section.items.map(renderNavItem)}
            </div>
          </div>
        ))}
      </div>

      {/* User Profile */}
      <div className="p-4 border-t border-white/5 bg-black/20">
        <div
          className={`
            flex items-center rounded-xl p-2 transition-colors hover:bg-white/5 cursor-pointer
            gap-3 [.sidebar-collapsed_&]:justify-center
          `}
        >
          <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-semibold text-sm shadow-inner flex-shrink-0 border-2 border-white/10">
            JD
          </div>
          <div className="[.sidebar-collapsed_&]:hidden overflow-hidden">
            <p className="text-sm font-medium text-white truncate">John Doe</p>
            <p className="text-xs text-slate-400 truncate">admin@novahr.com</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
