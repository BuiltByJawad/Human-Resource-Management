'use client'

import type { Column } from '@/components/ui/DataTable'
import { getNestedValue } from '@/lib/utils/table'

interface TableCoreProps<T> {
  columns: Column<T>[]
  data: T[]
  loading: boolean
  onRowClick?: (item: T) => void
  sortKey: keyof T | string | null
  sortDirection: 'asc' | 'desc'
  onSort: (key: keyof T | string) => void
}

export function TableCore<T extends { id: string }>({
  columns,
  data,
  loading,
  onRowClick,
  sortKey,
  sortDirection,
  onSort,
}: TableCoreProps<T>) {
  return (
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
                  onClick={() => onSort(key)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.header}</span>
                    {sortKey === key && (
                      <span className="text-blue-600">{sortDirection === 'asc' ? '↑' : '↓'}</span>
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
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-4 text-center text-sm text-gray-500">
                No data found
              </td>
            </tr>
          ) : (
            data.map((item, index) => {
              const rowKey = item.id ? String(item.id) : `row-${index}`
              return (
                <tr
                  key={rowKey}
                  className={`hover:bg-gray-50 ${onRowClick ? 'cursor-pointer' : ''}`}
                  onClick={() => onRowClick?.(item)}
                >
                  {(Array.isArray(columns) ? columns : []).map((column) => {
                    const key = column.accessorKey || column.key
                    const value = getNestedValue(item, String(key))
                    return (
                      <td key={String(key)} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {column.cell
                          ? column.cell(item)
                          : column.render
                            ? column.render(value, item)
                            : String(value ?? '')}
                      </td>
                    )
                  })}
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}
