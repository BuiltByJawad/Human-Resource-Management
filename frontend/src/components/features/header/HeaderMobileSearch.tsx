'use client'

import { ArrowLeftIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'

type HeaderMobileSearchProps = {
  searchQuery: string
  onChange: (value: string) => void
  onSubmit: () => void
  onClose: () => void
}

export function HeaderMobileSearch({ searchQuery, onChange, onSubmit, onClose }: HeaderMobileSearchProps) {
  return (
    <div className="flex items-center w-full gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
      <button
        onClick={onClose}
        className="p-2 -ml-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-full"
      >
        <ArrowLeftIcon className="h-5 w-5" />
      </button>
      <div className="relative flex-1">
        <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
        <input
          type="text"
          placeholder="Search employees..."
          autoFocus
          value={searchQuery}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              onSubmit()
              onClose()
            }
          }}
          className="w-full h-10 rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  )
}
