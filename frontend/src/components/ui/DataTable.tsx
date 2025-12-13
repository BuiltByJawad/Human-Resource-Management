'use client'

import { useState } from 'react'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'

export interface Column<T> {
  key: keyof T | string
  header: string
  render?: (value: any, item: T) => React.ReactNode
  accessorKey?: keyof T | string // Alias for key
  cell?: (item: T) => React.ReactNode // Alias for render
  id?: string
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  pageSize?: number
  onRowClick?: (item: T) => void
  className?: string
  loading?: boolean
  searchKeys?: string[]
}

export function DataTable<T extends { id: string }>({
  data,
  columns,
  pageSize = 10,
  onRowClick,
  className = '',
  loading = false,
  searchKeys = []
}: DataTableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1)
  const [sortKey, setSortKey] = useState<keyof T | string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [searchQuery, setSearchQuery] = useState('')

  // Helper to get nested value
  const getNestedValue = (obj: any, path: string) => {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj)
  }

  // Filter data based on search query - with comprehensive array check
  const safeData = Array.isArray(data) ? data : []
  const filteredData = safeData.filter(item => {
    if (!searchQuery || searchKeys.length === 0) return true
    return searchKeys.some(key => {
      const value = getNestedValue(item, key)
      return String(value ?? '').toLowerCase().includes(searchQuery.toLowerCase())
    })
  })

  const safeFilteredData = filteredData
  const totalPages = Math.ceil(safeFilteredData.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize

  const sortedData = [...safeFilteredData].sort((a, b) => {
    if (!sortKey) return 0

    // Handle custom accessor keys if needed, for now simple property access
    const aValue = getNestedValue(a, sortKey as string)
    const bValue = getNestedValue(b, sortKey as string)

    if (aValue === null || aValue === undefined) return 1
    if (bValue === null || bValue === undefined) return -1

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue)
    }

    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue
    }

    return 0
  })

  const paginatedData = sortedData.slice(startIndex, endIndex)

  const handleSort = (key: keyof T | string) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDirection('asc')
    }
  }

  return (
    <div className={`bg-white shadow rounded-lg overflow-hidden ${className}`}>
      {searchKeys.length > 0 && (
        <div className="p-4 border-b border-gray-200">
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-64 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {(Array.isArray(columns) ? columns : []).map((column) => {
                const key = column.accessorKey || column.key
                return (
                  <th
                    key={String(key)}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort(key)}
                  >
                    <div className="flex items-center space-x-1">
                      <span>{column.header}</span>
                      {sortKey === key && (
                        <span className="text-blue-600">
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-4 text-center text-sm text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-4 text-center text-sm text-gray-500">
                  No data found
                </td>
              </tr>
            ) : (
              paginatedData.map((item) => (
                <tr
                  key={item.id}
                  className={`hover:bg-gray-50 ${onRowClick ? 'cursor-pointer' : ''}`}
                  onClick={() => onRowClick?.(item)}
                >
                  {(Array.isArray(columns) ? columns : []).map((column) => {
                    const key = column.accessorKey || column.key
                    return (
                      <td key={String(key)} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {column.cell
                          ? column.cell(item)
                          : column.render
                            ? column.render((item as any)[key], item)
                            : String((item as any)[key] ?? '')}
                      </td>
                    )
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                <span className="font-medium">{Math.min(endIndex, safeFilteredData.length)}</span> of{' '}
                <span className="font-medium">{safeFilteredData.length}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  <ChevronLeftIcon className="h-5 w-5" />
                </button>
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${currentPage === i + 1
                      ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                      : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  <ChevronRightIcon className="h-5 w-5" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

interface StatsCardProps {
  title: string
  value: string | number
  change?: string
  changeType?: 'increase' | 'decrease' | 'warning'
  icon: React.ComponentType<{ className?: string }>
  className?: string
}

export function StatsCard({ title, value, change, changeType, icon: Icon, className = '' }: StatsCardProps) {
  return (
    <div className={`bg-white overflow-hidden shadow-sm hover:shadow-md rounded-xl border border-gray-100 transition-shadow h-full flex flex-col ${className}`}>
      <div className="p-5 sm:p-6 flex-1">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <Icon className="h-6 w-6 text-gray-400" />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd className="flex items-baseline">
                <div className="text-2xl font-semibold text-gray-900">{value}</div>
                {change && (
                  <div className={`ml-2 flex items-baseline text-sm font-semibold ${changeType === 'increase' ? 'text-green-600' : changeType === 'warning' ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                    {changeType === 'increase' ? '↑' : changeType === 'warning' ? '!' : '↓'} {change}
                  </div>
                )}
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}