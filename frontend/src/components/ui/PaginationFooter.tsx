"use client"

import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'

interface PaginationFooterProps {
  currentPage: number
  totalPages: number
  totalItems: number
  pageSize: number
  pageSizeOptions?: number[]
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
}

export function PaginationFooter({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  pageSizeOptions = [10, 20, 30, 50],
  onPageChange,
  onPageSizeChange,
}: PaginationFooterProps) {
  if (totalPages <= 1 && totalItems <= pageSize) return null

  const pageOptions = Array.from({ length: totalPages }, (_, index) => index + 1)

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-t border-gray-200 pt-4">
      <div className="text-sm text-gray-500">
        Page <span className="font-medium text-gray-900">{currentPage}</span> of{' '}
        <span className="font-medium text-gray-900">{Math.max(totalPages, 1)}</span> ·{' '}
        <span className="font-medium text-gray-900">{totalItems}</span> total
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>Rows</span>
          <select
            value={pageSize}
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
            className="h-9 rounded-lg border border-gray-300 bg-white px-2 text-sm font-medium text-gray-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            {pageSizeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-40"
          >
            <ChevronLeftIcon className="h-4 w-4" />
            Prev
          </button>

          <select
            value={currentPage}
            onChange={(event) => onPageChange(Number(event.target.value))}
            className="h-9 rounded-lg border border-gray-300 bg-white px-2 text-sm font-medium text-gray-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            {pageOptions.map((page) => (
              <option key={page} value={page}>
                Page {page}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage >= totalPages}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-40"
          >
            Next
            <ChevronRightIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
