'use client'

interface TableToolbarProps {
  searchQuery: string
  onSearchChange: (value: string) => void
  showSearch: boolean
}

export function TableToolbar({ searchQuery, onSearchChange, showSearch }: TableToolbarProps) {
  if (!showSearch) return null

  return (
    <div className="p-4 border-b border-gray-200">
      <input
        type="text"
        placeholder="Search..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-full sm:w-64 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
      />
    </div>
  )
}
