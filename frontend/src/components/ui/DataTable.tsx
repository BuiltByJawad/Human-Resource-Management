'use client'

import { useDataTable } from '@/hooks/useDataTable'
import { TableToolbar } from '@/components/ui/data-table/TableToolbar'
import { TableCore } from '@/components/ui/data-table/TableCore'
import { TablePagination } from '@/components/ui/data-table/TablePagination'

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
  const {
    searchQuery,
    setSearchQuery,
    currentPage,
    setCurrentPage,
    sortKey,
    sortDirection,
    handleSort,
    filteredData,
    paginatedData,
    totalPages,
    startIndex,
    endIndex,
  } = useDataTable({
    data,
    columns,
    pageSize,
    searchKeys,
  })

  return (
    <div className={`bg-white shadow rounded-lg overflow-hidden ${className}`}>
      <TableToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        showSearch={searchKeys.length > 0}
      />

      <TableCore
        columns={columns}
        data={paginatedData}
        loading={loading}
        onRowClick={onRowClick}
        sortKey={sortKey}
        sortDirection={sortDirection}
        onSort={handleSort}
      />

      <TablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        startIndex={startIndex}
        endIndex={endIndex}
        totalItems={filteredData.length}
        onPageChange={setCurrentPage}
      />
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