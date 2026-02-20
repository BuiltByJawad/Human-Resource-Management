"use client"

import { useMemo, useState } from 'react'

import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { LoadingSpinner } from '@/components/ui/CommonComponents'
import { DocumentCategoryForm, DocumentCategoryList } from '@/components/features/documentCategories'
import { useDocumentCategories } from '@/hooks/useDocumentCategories'
import type { DocumentCategory, UpsertDocumentCategoryPayload } from '@/services/documentCategories/types'

interface DocumentCategoriesPageClientProps {
  initialCategories?: DocumentCategory[]
}

export function DocumentCategoriesPageClient({ initialCategories = [] }: DocumentCategoriesPageClientProps) {
  const {
    categories,
    loading,
    formErrors,
    setFormErrors,
    isModalOpen,
    setIsModalOpen,
    editing,
    setEditing,
    isDeleteOpen,
    setIsDeleteOpen,
    toDelete,
    setToDelete,
    saveMutation,
    deleteMutation,
  } = useDocumentCategories(initialCategories)

  const [searchTerm, setSearchTerm] = useState('')

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return categories
    return categories.filter((c) => `${c.name} ${c.description ?? ''}`.toLowerCase().includes(term))
  }, [categories, searchTerm])

  const actionLoading = saveMutation.isPending || deleteMutation.isPending

  const handleCreate = () => {
    setFormErrors({})
    setEditing(null)
    setIsModalOpen(true)
  }

  const handleEdit = (category: DocumentCategory) => {
    setFormErrors({})
    setEditing(category)
    setIsModalOpen(true)
  }

  const handleDeleteRequest = (category: DocumentCategory) => {
    setToDelete(category)
    setIsDeleteOpen(true)
  }

  const handleSubmit = async (payload: UpsertDocumentCategoryPayload) => {
    await saveMutation.mutateAsync({ payload, id: editing?.id })
  }

  const handleDeleteConfirm = async () => {
    if (!toDelete) return
    await deleteMutation.mutateAsync(toDelete.id)
  }

  return (
    <>
      <div className="p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Document Categories</h1>
                <p className="mt-1 text-sm text-gray-500">Control which categories are available and whether employees can upload into them.</p>
              </div>
              <button
                onClick={handleCreate}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              >
                Add Category
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search categories..."
                  className="w-full sm:max-w-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <LoadingSpinner size="lg" />
                <p className="mt-4 text-sm font-medium text-gray-500">Loading categories…</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <DocumentCategoryList categories={filtered} onEdit={handleEdit} onDelete={handleDeleteRequest} loading={loading} />
              </div>
            )}
          </div>
        </div>
      </div>

      <DocumentCategoryForm
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        initialData={editing}
        loading={actionLoading}
        apiErrors={formErrors}
      />

      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Category"
        message={`Are you sure you want to delete "${toDelete?.name ?? ''}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        loading={deleteMutation.isPending}
      />
    </>
  )
}
