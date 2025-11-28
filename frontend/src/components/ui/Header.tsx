'use client'

import { useState, useEffect } from 'react'

import { BellIcon, MagnifyingGlassIcon, ChevronDownIcon, Bars3Icon, ArrowLeftIcon } from '@heroicons/react/24/outline'
import { useAuthStore } from '@/store/useAuthStore'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useClickOutside } from '@/hooks/useClickOutside'
import MobileMenu from './MobileMenu'
import { useOrgStore } from '@/store/useOrgStore'

export default function Header() {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isMounted, setIsMounted] = useState(false)

  const { user, logout, isLoggingOut } = useAuthStore()
  const { siteName, tagline } = useOrgStore()

  const router = useRouter()

  const profileRef = useClickOutside<HTMLDivElement>(() => setIsProfileOpen(false))
  const notificationsRef = useClickOutside<HTMLDivElement>(() => setIsNotificationsOpen(false))

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  const notifications = [
    { id: 1, title: 'New leave request', message: 'John Doe requested 3 days leave', time: '2 hours ago' },
    { id: 2, title: 'Payroll processed', message: 'Monthly payroll has been processed', time: '1 day ago' },
  ]

  // Show skeleton if not mounted or user is not loaded
  if (!isMounted || !user) {
    return (
      <header className="bg-white/80 backdrop-blur border-b border-slate-200/80 sticky top-0 z-30">
        <div className="flex items-center justify-between px-4 sm:px-6 py-4">
          <div className="flex items-center flex-1 gap-3">
            <div className="hidden sm:flex flex-col">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{tagline}</p>
              <h1 className="text-lg font-semibold text-slate-900">{siteName}</h1>
            </div>

            <div className="flex-1"></div>
            <div className="relative w-full max-w-sm">
              <div className="w-full h-10 rounded-2xl bg-slate-100 animate-pulse"></div>
            </div>
          </div>
          <div className="ml-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-slate-100 animate-pulse"></div>
            <div className="flex h-12 items-center gap-3 rounded-full bg-white border border-slate-200 px-3 shadow-sm">
              <div className="h-8 w-8 rounded-full bg-slate-100 animate-pulse"></div>
              <div className="hidden md:flex flex-col gap-1">
                <div className="h-3 w-24 bg-slate-100 rounded animate-pulse"></div>
                <div className="h-2 w-16 bg-slate-100 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>

        {isLoggingOut && (
          <div className="fixed inset-0 z-[9999] bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center">
            <div className="h-12 w-12 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-sm font-medium text-slate-700">Signing you out</p>
          </div>
        )}
      </header>
    )
  }

  const initials = user?.firstName && user?.lastName
    ? `${user.firstName[0]}${user.lastName[0]}`
    : 'U'

  return (
    <header className="bg-white/80 backdrop-blur border-b border-slate-200/80 sticky top-0 z-30">
      <div className="flex items-center justify-between px-4 sm:px-6 py-4">

        {isMobileSearchOpen ? (
          <div className="flex items-center w-full gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <button
              onClick={() => setIsMobileSearchOpen(false)}
              className="p-2 -ml-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-full"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search..."
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    router.push(`/employees?search=${encodeURIComponent(searchQuery)}`)
                    setIsMobileSearchOpen(false)
                  }
                }}
                className="w-full h-10 rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        ) : (
          <>
            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden h-10 w-10 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center mr-3 flex-shrink-0"
            >
              <Bars3Icon className="h-6 w-6" />
            </button>

            <div className="flex items-center flex-1 gap-3">
              <div className="hidden sm:flex flex-col">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{tagline}</p>
                <h1 className="text-lg font-semibold text-slate-900">{siteName}</h1>
              </div>
              <div className="flex-1"></div>

              {/* Search Bar - Hidden on mobile, visible on desktop */}
              <div className="relative w-full max-w-sm hidden md:block">
                <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search people, teams, docs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      router.push(`/employees?search=${encodeURIComponent(searchQuery)}`)
                    }
                  }}
                  className="w-full h-10 rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Mobile Search Icon */}
              <button
                onClick={() => setIsMobileSearchOpen(true)}
                className="md:hidden h-10 w-10 rounded-full text-slate-500 hover:bg-slate-100 flex items-center justify-center"
              >
                <MagnifyingGlassIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="ml-4 flex items-center gap-3">
              <div className="relative" ref={notificationsRef}>
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

              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex h-12 items-center gap-3 rounded-full bg-white border border-slate-200 px-3 text-sm text-slate-700 shadow-sm"
                >
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt="Profile" className="h-8 w-8 rounded-full object-cover" />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 text-white flex items-center justify-center font-semibold">
                      {initials}
                    </div>
                  )}
                  <div className="hidden md:flex flex-col text-left">
                    <span className="text-sm font-semibold">{user.firstName} {user.lastName}</span>
                    <span className="text-xs text-slate-400">{user.role}</span>
                  </div>
                  <ChevronDownIcon className="h-4 w-4 text-slate-400" />
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 z-50">
                    <div className="px-4 py-3 border-b border-slate-100">
                      <p className="text-sm font-semibold text-slate-900">{user.firstName} {user.lastName}</p>
                      <p className="text-xs text-slate-500">{user.email}</p>
                    </div>
                    <div className="py-1">
                      <Link href="/profile" className="block w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">Profile</Link>
                      <Link href="/settings" className="block w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">Settings</Link>
                      <button className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">Support</button>
                    </div>
                    <div className="border-t border-slate-100">
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-rose-500 hover:bg-rose-50"
                      >
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
      <MobileMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} user={user} />

      {isLoggingOut && (
        <div className="fixed inset-0 z-[9999] bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center">
          <div className="h-12 w-12 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-sm font-medium text-slate-700">Signing you out</p>
        </div>
      )}
    </header>
  )
}