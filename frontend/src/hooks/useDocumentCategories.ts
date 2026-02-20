'use client'

import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/components/ui/ToastProvider'
import { handleCrudError } from '@/lib/apiError'
import { useAuthStore } from '@/store/useAuthStore'
import type { DocumentCategory, UpsertDocumentCategoryPayload } from '@/services/documentCategories/types'
import {
  createDocumentCategory,
  deleteDocumentCategory,
  fetchDocumentCategories,
  updateDocumentCategory,
} from '@/services/documentCategories/api'

export type DocumentCategoryFormErrors = Partial<Record<'name' | 'description' | 'sortOrder', string>>

export function useDocumentCategories(initial: DocumentCategory[] = []) {
  const { token } = useAuthStore()
  const { showToast } = useToast()
  const queryClient = useQueryClient()

  const [formErrors, setFormErrors] = useState<DocumentCategoryFormErrors>({})
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editing, setEditing] = useState<DocumentCategory | null>(null)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [toDelete, setToDelete] = useState<DocumentCategory | null>(null)

  const categoriesQuery = useQuery<DocumentCategory[]>({
    queryKey: ['document-categories', token],
    queryFn: () => fetchDocumentCategories({ includeInactive: true }, token ?? undefined),
    enabled: !!token,
    initialData: initial.length ? initial : undefined,
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['document-categories'] })
  }

  const saveMutation = useMutation({
    mutationFn: async ({ payload, id }: { payload: UpsertDocumentCategoryPayload; id?: string }) => {
      if (id) {
        return updateDocumentCategory(id, payload, token ?? undefined)
      }
      return createDocumentCategory(payload, token ?? undefined)
    },
    onSuccess: (_category, variables) => {
      showToast(variables.id ? 'Category updated' : 'Category created', 'success')
      setFormErrors({})
      setIsModalOpen(false)
      setEditing(null)
      invalidate()
    },
    onError: (error: unknown) => {
      handleCrudError({
        error,
        resourceLabel: 'Document category',
        showToast,
        setFieldError: (field, message) => setFormErrors((prev) => ({ ...prev, [field]: message })),
        defaultField: 'name',
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => deleteDocumentCategory(id, token ?? undefined),
    onSuccess: () => {
      showToast('Category deleted', 'success')
      setIsDeleteOpen(false)
      setToDelete(null)
      invalidate()
    },
    onError: (error: unknown) => {
      handleCrudError({
        error,
        resourceLabel: 'Document category',
        showToast,
      })
    },
  })

  const categories = categoriesQuery.data ?? []
  const activeCategories = useMemo(() => categories.filter((c) => c.isActive), [categories])

  return {
    categories,
    activeCategories,
    loading: categoriesQuery.isPending || !token,
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
  }
}
