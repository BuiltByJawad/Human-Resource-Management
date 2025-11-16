'use client'

import { useState } from 'react'
import { BellIcon, MagnifyingGlassIcon, ChevronDownIcon } from '@heroicons/react/24/outline'

export default function Header() {
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)

  const notifications = [
    { id: 1, title: 'New leave request', message: 'John Doe requested 3 days leave', time: '2 hours ago' },
    { id: 2, title: 'Payroll processed', message: 'Monthly payroll has been processed', time: '1 day ago' },
  ]

  return (
    <header className="bg-white/80 backdrop-blur border-b border-slate-200/80 sticky top-0 z-30">
      <div className="flex items-center justify-between px-4 sm:px-6 py-4">
        <div className="flex items-center flex-1 gap-3">
          <div className="hidden sm:flex flex-col">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Human Resource OS</p>
            <h1 className="text-lg font-semibold text-slate-900">Command Center</h1>
          </div>
          <div className="flex-1"></div>
          <div className="relative w-full max-w-sm">
            <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search people, teams, docs..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="ml-4 flex items-center gap-3">
          <div className="relative">
            <button
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="h-10 w-10 rounded-full bg-slate-100 text-slate-500 hover:text-slate-700 flex items-center justify-center"
            >
              <BellIcon className="h-5 w-5" />
              <span className="absolute top-2 right-2 block h-2 w-2 rounded-full bg-rose-500"></span>
            </button>

            {isNotificationsOpen && (
              <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 z-50">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-800">Notifications</h3>
                  <button className="text-xs text-blue-600">Mark all read</button>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {notifications.map((notification) => (
                    <div key={notification.id} className="px-4 py-3 hover:bg-slate-50 transition">
                      <p className="text-sm font-medium text-slate-900">{notification.title}</p>
                      <p className="text-xs text-slate-500">{notification.message}</p>
                      <p className="text-xs text-slate-400 mt-1">{notification.time}</p>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-2 border-t border-slate-100">
                  <button className="text-sm text-blue-600 hover:text-blue-700">View all updates</button>
                </div>
              </div>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-3 rounded-full bg-white border border-slate-200 px-3 py-1.5 text-sm text-slate-700 shadow-sm"
            >
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 text-white flex items-center justify-center font-semibold">
                JD
              </div>
              <div className="hidden md:flex flex-col text-left">
                <span className="text-sm font-semibold">John Doe</span>
                <span className="text-xs text-slate-400">Administrator</span>
              </div>
              <ChevronDownIcon className="h-4 w-4 text-slate-400" />
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 z-50">
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="text-sm font-semibold text-slate-900">John Doe</p>
                  <p className="text-xs text-slate-500">john@novahr.com</p>
                </div>
                <div className="py-1">
                  <button className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">Profile</button>
                  <button className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">Settings</button>
                  <button className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">Support</button>
                </div>
                <div className="border-t border-slate-100">
                  <button className="w-full text-left px-4 py-2 text-sm text-rose-500 hover:bg-rose-50">Sign out</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}