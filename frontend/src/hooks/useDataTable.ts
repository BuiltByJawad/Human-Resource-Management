'use client'

import { useEffect, useMemo, useState } from 'react'
import type { Column } from '@/components/ui/DataTable'
import { clampPage, filterData, paginateData, sortData, type SortDirection } from '@/lib/utils/table'

interface UseDataTableOptions<T> {
  data: T[]
  columns: Column<T>[]
  pageSize: number
  searchKeys: string[]
}

export function useDataTable<T extends { id: string }>({ data, columns, pageSize, searchKeys }: UseDataTableOptions<T>) {
  const [currentPage, setCurrentPage] = useState(1)
  const [sortKey, setSortKey] = useState<keyof T | string | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [searchQuery, setSearchQuery] = useState('')

  const safeData = Array.isArray(data) ? data : []

  const filteredData = useMemo(() => filterData(safeData, searchKeys, searchQuery), [safeData, searchKeys, searchQuery])
  const sortedData = useMemo(() => sortData(filteredData, sortKey, sortDirection), [filteredData, sortKey, sortDirection])

  const totalPages = Math.ceil(filteredData.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const paginatedData = useMemo(() => paginateData(sortedData, currentPage, pageSize), [sortedData, currentPage, pageSize])

  useEffect(() => {
    const nextPage = clampPage(currentPage, totalPages)
    if (nextPage !== currentPage) setCurrentPage(nextPage)
  }, [currentPage, totalPages])

  const handleSort = (key: keyof T | string) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDirection('asc')
    }
  }

  return {
    columns,
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
  }
}
