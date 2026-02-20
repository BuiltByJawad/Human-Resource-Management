"use client"

import React from 'react'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'

import type { CompanyDocument } from '@/services/documents/types'
import { DocumentCard, UploadDocumentDialog } from '@/components/features/documents'
import { Skeleton } from '@/components/ui/Skeleton'
import { useDocumentsPortal } from '@/hooks/useDocumentsPortal'
import { useAuthStore } from '@/store/useAuthStore'
import { PERMISSIONS } from '@/constants/permissions'

interface DocumentsPageClientProps {
  initialDocuments?: CompanyDocument[]
  initialCategory?: string
}

export function DocumentsPageClient({
  initialDocuments = [],
  initialCategory = 'All'
}: DocumentsPageClientProps) {
  const hasPermission = useAuthStore((state) => state.hasPermission)
  const isAdmin = hasPermission(PERMISSIONS.MANAGE_DOCUMENTS)
  const canUploadDocuments = isAdmin || hasPermission(PERMISSIONS.UPLOAD_DOCUMENTS)
  const {
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
  } = useDocumentsPortal({ initialDocuments, initialCategory })

  return (
    <div className="p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Company Documents</h1>
            <p className="text-gray-600">Access policies, handbooks, and forms.</p>
          </div>
          {canUploadDocuments && <UploadDocumentDialog onSuccess={() => refetch()} />}
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1 w-full md:max-w-sm">
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
            {Array.from({ length: filteredDocs.length || initialDocuments.length || 0 }).map((_, idx) => (
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
    </div>
  )
}
