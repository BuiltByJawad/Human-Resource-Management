export type SortDirection = 'asc' | 'desc'

export const getNestedValue = <T>(obj: T, path: string): unknown => {
  return path.split('.').reduce<unknown>((acc, part) => {
    if (acc && typeof acc === 'object' && part in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[part]
    }
    return undefined
  }, obj as unknown)
}

export const filterData = <T>(data: T[], searchKeys: string[], searchQuery: string): T[] => {
  if (!searchQuery || searchKeys.length === 0) return data
  const normalized = searchQuery.toLowerCase()

  return data.filter((item) =>
    searchKeys.some((key) => {
      const value = getNestedValue(item, key)
      return String(value ?? '').toLowerCase().includes(normalized)
    })
  )
}

export const sortData = <T>(data: T[], sortKey: keyof T | string | null, direction: SortDirection): T[] => {
  if (!sortKey) return data
  const key = String(sortKey)

  return [...data].sort((a, b) => {
    const aValue = getNestedValue(a, key)
    const bValue = getNestedValue(b, key)

    if (aValue == null && bValue == null) return 0
    if (aValue == null) return 1
    if (bValue == null) return -1

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return direction === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
    }

    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return direction === 'asc' ? aValue - bValue : bValue - aValue
    }

    return 0
  })
}

export const paginateData = <T>(data: T[], page: number, pageSize: number): T[] => {
  const startIndex = (page - 1) * pageSize
  return data.slice(startIndex, startIndex + pageSize)
}

export const clampPage = (page: number, totalPages: number): number => {
  if (totalPages <= 0) return 1
  return Math.min(Math.max(page, 1), totalPages)
}
