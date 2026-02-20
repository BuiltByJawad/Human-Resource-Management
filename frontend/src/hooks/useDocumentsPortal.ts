'use client'

import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useToast } from '@/components/ui/ToastProvider'
import { handleCrudError } from '@/lib/apiError'
import type { CompanyDocument } from '@/services/documents/types'
import { fetchDocuments } from '@/services/documents/api'
import { fetchDocumentCategories } from '@/services/documentCategories/api'
import type { DocumentCategory } from '@/services/documentCategories/types'

interface UseDocumentsPortalOptions {
  initialDocuments: CompanyDocument[]
  initialCategory: string
}

export function useDocumentsPortal({ initialDocuments, initialCategory }: UseDocumentsPortalOptions) {
  const { showToast } = useToast()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory)

  const {
    data: documents = [],
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuery<CompanyDocument[], Error>({
    queryKey: ['documents'],
    queryFn: () => fetchDocuments(),
    retry: false,
    initialData: initialDocuments,
    placeholderData: (previousData) => previousData ?? initialDocuments,
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
  })

  const categoriesQuery = useQuery<DocumentCategory[]>({
    queryKey: ['document-categories', 'active'],
    queryFn: () => fetchDocumentCategories({ includeInactive: false }),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  })

  useEffect(() => {
    if (isError && error) {
      handleCrudError({
        error,
        resourceLabel: 'Documents',
        showToast,
      })
    }
  }, [isError, error, showToast])

  const filteredDocs = useMemo<CompanyDocument[]>(() => {
    const term = searchTerm.toLowerCase()
    return (documents || []).filter((doc) => {
      const matchesSearch = doc.title.toLowerCase().includes(term) || doc.category.toLowerCase().includes(term)
      const matchesCategory = selectedCategory === 'All' || doc.category === selectedCategory
      return matchesSearch && matchesCategory
    })
  }, [documents, searchTerm, selectedCategory])

  const skeletonCount = filteredDocs.length || documents.length || initialDocuments.length || 0
  const showSkeletons = (isLoading || isFetching) && skeletonCount > 0

  const categories = useMemo(() => {
    const active = (categoriesQuery.data ?? []).filter((c) => c.isActive)
    if (active.length > 0) {
      return ['All', ...active.map((c) => c.name)]
    }

    const inferred = Array.from(new Set((documents ?? []).map((doc) => doc.category).filter(Boolean))).sort()
    return ['All', ...inferred]
  }, [categoriesQuery.data, documents])

  return {
    categories,
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    filteredDocs,
    showSkeletons,
    isLoading,
    isError,
    refetch,
  }
}
