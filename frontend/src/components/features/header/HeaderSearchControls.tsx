'use client'

import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'

type HeaderSearchControlsProps = {
  searchQuery: string
  onChange: (value: string) => void
  onSubmit: () => void
  onOpenMobileSearch: () => void
}

export function HeaderSearchControls({ searchQuery, onChange, onSubmit, onOpenMobileSearch }: HeaderSearchControlsProps) {
  return (
    <>
      <div className="relative w-full max-w-sm hidden md:block">
        <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
        <input
          type="text"
          placeholder="Search employees..."
          value={searchQuery}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              onSubmit()
            }
          }}
          className="w-full h-10 rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <button
        onClick={onOpenMobileSearch}
        className="md:hidden h-10 w-10 rounded-full text-slate-500 hover:bg-slate-100 flex items-center justify-center"
      >
        <MagnifyingGlassIcon className="h-6 w-6" />
      </button>
    </>
  )
}
