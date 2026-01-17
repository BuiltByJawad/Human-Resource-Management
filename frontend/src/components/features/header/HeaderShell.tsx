"use client"

import type { ReactNode } from 'react'

interface HeaderShellProps {
  isMobileSearchOpen: boolean
  mobileSearch: ReactNode
  defaultContent: ReactNode
  mobileMenu: ReactNode
}

export function HeaderShell({ isMobileSearchOpen, mobileSearch, defaultContent, mobileMenu }: HeaderShellProps) {
  return (
    <header className="glass-header sticky top-0 z-30">
      <div className="flex items-center justify-between px-4 sm:px-6 py-4">
        {isMobileSearchOpen ? mobileSearch : defaultContent}
      </div>
      {mobileMenu}
    </header>
  )
}
