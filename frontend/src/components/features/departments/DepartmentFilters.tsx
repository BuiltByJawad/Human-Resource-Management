"use client"

import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'

interface DepartmentFiltersProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  onCreate: () => void
}

export function DepartmentFilters({ searchTerm, onSearchChange, onCreate }: DepartmentFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Departments</h1>
        <p className="mt-1 text-sm text-gray-500">Manage company structure and hierarchy</p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search departments"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 w-full sm:w-64"
          />
        </div>
        <button
          onClick={onCreate}
          className="inline-flex items-center px-4 py-2.5 border border-transparent rounded-xl shadow-lg shadow-blue-600/20 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-all active:scale-[0.98] outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Add Department
        </button>
      </div>
    </div>
  )
}
