"use client"

import React, { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'

import { getDocuments, type CompanyDocument } from '@/features/documents'
import { DocumentCard } from '@/components/modules/documents/DocumentCard'
import { UploadDocumentDialog } from '@/components/modules/documents/UploadDocumentDialog'
import Sidebar from '@/components/ui/Sidebar'
import Header from '@/components/ui/Header'
import { Skeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/components/ui/ToastProvider'
import { handleCrudError } from '@/lib/apiError'
import { useAuth } from '@/features/auth'

const categories = ['All', 'HR Policy', 'IT Policy', 'Handbook', 'Form', 'Other']

interface DocumentsPageClientProps {
  initialDocuments?: CompanyDocument[]
  initialCategory?: string
}

export function DocumentsPageClient({
  initialDocuments = [],
  initialCategory = 'All'
}: DocumentsPageClientProps) {
  const { showToast } = useToast()
  const { token } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory)
  const isAdmin = true

  const {
    data: documents = [],
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuery<CompanyDocument[], Error>({
    queryKey: ['documents', selectedCategory, token],
    queryFn: () => getDocuments(selectedCategory, token ?? undefined),
    retry: false,
    initialData: initialDocuments,
    placeholderData: (previousData) => previousData ?? initialDocuments,
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
  })

  useEffect(() => {
    if (isError && error) {
      handleCrudError({
        error,
        resourceLabel: 'Documents',
        showToast
      })
    }
  }, [isError, error, showToast])

  const filteredDocs = useMemo<CompanyDocument[]>(() => {
    const term = searchTerm.toLowerCase()
    return (documents || []).filter((doc: CompanyDocument) => {
      const matchesSearch =
        doc.title.toLowerCase().includes(term) || doc.category.toLowerCase().includes(term)
      const matchesCategory = selectedCategory === 'All' || doc.category === selectedCategory
      return matchesSearch && matchesCategory
    })
  }, [documents, searchTerm, selectedCategory])

  const skeletonCount = filteredDocs.length || documents.length || initialDocuments.length || 0
  const showSkeletons = (isLoading || isFetching) && skeletonCount > 0
  const isEmpty = !showSkeletons && filteredDocs.length === 0

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Company Documents</h1>
                <p className="text-gray-600">Access policies, handbooks, and forms.</p>
              </div>
              {isAdmin && <UploadDocumentDialog onSuccess={() => refetch()} />}
            </div>

            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1 max-w-sm">
                <MagnifyingGlassIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search documents..."
                  className="pl-9 pr-4 py-2 w-full border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                      selectedCategory === cat
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-100 border'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {showSkeletons ? (
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {Array.from({ length: skeletonCount }).map((_, idx) => (
                    <Skeleton key={`doc-skeleton-${idx}`} className="h-40 w-full rounded-lg" />
                  ))}
                </div>
            ) : isLoading ? (
              <div className="text-center py-20 text-gray-500 border-2 border-dashed rounded-xl bg-white">
                <p>No documents found matching your criteria.</p>
              </div>
            ) : isError ? (
              <div className="text-red-600 text-sm">Failed to load documents. Please try again.</div>
            ) : filteredDocs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredDocs.map((doc: CompanyDocument) => (
                  <DocumentCard key={doc.id} doc={doc} isAdmin={isAdmin} onDelete={() => refetch()} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 text-gray-500 border-2 border-dashed rounded-xl bg-white">
                <p>No documents found matching your criteria.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
