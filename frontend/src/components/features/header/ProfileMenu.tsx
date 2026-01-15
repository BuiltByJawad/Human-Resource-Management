'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronDownIcon } from '@heroicons/react/24/outline'
import { useClickOutside } from '@/hooks/useClickOutside'
import { cn } from '@/lib/utils'

export type ProfileMenuProps = {
  userFullName: string
  userRole: string
  email?: string
  initials: string
  avatarUrl: string | null
  onLogout: () => void
}

export function ProfileMenu({ userFullName, userRole, email, initials, avatarUrl, onLogout }: ProfileMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const profileRef = useClickOutside<HTMLDivElement>(() => setIsOpen(false))

  return (
    <div className="relative" ref={profileRef}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex h-12 items-center gap-3 rounded-full bg-white border border-slate-200 px-3 text-sm text-slate-700 shadow-sm"
      >
        {avatarUrl ? (
          <div className="relative h-8 w-8 rounded-full overflow-hidden">
            <Image src={avatarUrl} alt="Profile" fill className="object-cover" sizes="32px" />
          </div>
        ) : (
          <div className="h-8 w-8 rounded-full bg-indigo-500 text-white flex items-center justify-center font-semibold text-xs">
            {initials}
          </div>
        )}
        <div className="hidden md:flex flex-col text-left max-w-32" suppressHydrationWarning>
          <span className="text-sm font-semibold truncate leading-tight">{userFullName}</span>
          <span className="text-xs text-slate-400 truncate leading-tight uppercase tracking-wider">{userRole}</span>
        </div>
        <ChevronDownIcon className="h-4 w-4 text-slate-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 z-50">
          <div className="px-4 py-3 border-b border-slate-100">
            <p className="text-sm font-semibold text-slate-900 truncate">{userFullName}</p>
            <p className="text-xs text-slate-500 truncate">{email}</p>
          </div>
          <div className="py-1">
            <Link href="/profile" className="block w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">
              Profile
            </Link>
            <Link href="/settings" className="block w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">
              Settings
            </Link>
          </div>
          <div className="border-t border-slate-100">
            <button
              onClick={onLogout}
              className={cn('w-full text-left px-4 py-2 text-sm text-rose-500 hover:bg-rose-50')}
            >
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
