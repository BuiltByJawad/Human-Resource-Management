'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: '📊' },
  { name: 'Employees', href: '/employees', icon: '👥' },
  { name: 'Departments', href: '/departments', icon: '🏢' },
  { name: 'Leave', href: '/leave', icon: '📅' },
  { name: 'Attendance', href: '/attendance', icon: '⏰' },
  { name: 'Payroll', href: '/payroll', icon: '💰' },
  { name: 'Performance', href: '/performance', icon: '📈' },
  { name: 'Documents', href: '/documents', icon: '📁' },
  { name: 'Reports', href: '/reports', icon: '📋' },
  { name: 'Settings', href: '/settings', icon: '⚙️' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <div className={`${isCollapsed ? 'w-16' : 'w-64'} bg-gray-800 text-white min-h-screen transition-all duration-300`}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className={`font-bold text-xl ${isCollapsed ? 'hidden' : 'block'}`}>
            HRM System
          </h1>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-md hover:bg-gray-700"
          >
            {isCollapsed ? '→' : '←'}
          </button>
        </div>
        
        <nav className="space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
                title={isCollapsed ? item.name : ''}
              >
                <span className="text-lg">{item.icon}</span>
                {!isCollapsed && <span className="ml-3">{item.name}</span>}
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}