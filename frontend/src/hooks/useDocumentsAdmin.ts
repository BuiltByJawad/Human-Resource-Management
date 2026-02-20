'use client'

import { useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/components/ui/ToastProvider'
import type { CompanyDocument, CompanyDocumentUploadPayload } from '@/services/documents/types'
import {
  deleteCompanyDocument,
  fetchCompanyDocuments,
  toggleDocumentVisibility,
  uploadCompanyDocument,
} from '@/services/documents/api'
import { fetchDocumentCategories } from '@/services/documentCategories/api'

const DEFAULT_FORM: CompanyDocumentUploadPayload = {
  title: '',
  description: '',
  category: '',
}

interface UseDocumentsAdminOptions {
  initialDocuments: CompanyDocument[]
}

export function useDocumentsAdmin({ initialDocuments }: UseDocumentsAdminOptions) {
  const { showToast } = useToast()
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [showUploadModal, setShowUploadModal] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadForm, setUploadForm] = useState(DEFAULT_FORM)
  const [filterCategory, setFilterCategory] = useState<string>('')

  const categoriesQuery = useQuery<string[]>({
    queryKey: ['document-categories', 'company', 'active'],
    queryFn: async () => {
      const categories = await fetchDocumentCategories({ includeInactive: false })
      return categories.filter((c) => c.isActive).map((c) => c.name)
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  })

  const categories = categoriesQuery.data ?? []

  const documentsQuery = useQuery<CompanyDocument[]>({
    queryKey: ['documents', 'company'],
    queryFn: fetchCompanyDocuments,
    initialData: initialDocuments,
    refetchOnWindowFocus: false,
  })

  const uploadMutation = useMutation({
    mutationFn: async ({ file, payload }: { file: File; payload: CompanyDocumentUploadPayload }) =>
      uploadCompanyDocument(file, payload),
    onSuccess: (result) => {
      if (result?.data) {
        queryClient.setQueryData<CompanyDocument[]>(['documents', 'company'], (prev = []) => [...prev, result.data])
      }
      showToast('Document uploaded successfully', 'success')
      setShowUploadModal(false)
      setUploadForm(DEFAULT_FORM)
      setSelectedFile(null)
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Failed to upload document'
      showToast(message, 'error')
    },
  })

  const toggleVisibilityMutation = useMutation({
    mutationFn: ({ documentId, isVisible }: { documentId: string; isVisible: boolean }) =>
      toggleDocumentVisibility(documentId, isVisible),
    onSuccess: (_, variables) => {
      queryClient.setQueryData<CompanyDocument[]>(['documents', 'company'], (prev = []) =>
        prev.map((doc) => (doc.id === variables.documentId ? { ...doc, isVisible: variables.isVisible } : doc))
      )
      showToast(`Document ${variables.isVisible ? 'visible' : 'hidden'} to employees`, 'success')
    },
    onError: () => {
      showToast('Failed to update visibility', 'error')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteCompanyDocument,
    onSuccess: (_, documentId) => {
      queryClient.setQueryData<CompanyDocument[]>(['documents', 'company'], (prev = []) =>
        prev.filter((doc) => doc.id !== documentId)
      )
      showToast('Document deleted', 'success')
    },
    onError: () => {
      showToast('Failed to delete document', 'error')
    },
  })

  const documents = documentsQuery.data ?? []
  const filteredDocuments = useMemo(
    () => (filterCategory ? documents.filter((doc) => doc.category === filterCategory) : documents),
    [documents, filterCategory]
  )

  const handleFileSelect = (file: File | null) => {
    setSelectedFile(file)
    if (file && !uploadForm.title) {
      setUploadForm((prev) => ({ ...prev, title: file.name.replace(/\.[^/.]+$/, '') }))
    }
  }

  const handleUpload = async () => {
    if (!selectedFile || !uploadForm.title.trim()) {
      showToast('Please select a file and enter a title', 'error')
      return
    }

    if (!uploadForm.category) {
      const fallback = categories[0]
      if (fallback) {
        setUploadForm((prev) => ({ ...prev, category: fallback }))
      } else {
        showToast('Please select a category', 'error')
        return
      }
    }

    await uploadMutation.mutateAsync({ file: selectedFile, payload: uploadForm })
  }

  const handleToggleVisibility = (doc: CompanyDocument) => {
    toggleVisibilityMutation.mutate({ documentId: doc.id, isVisible: !doc.isVisible })
  }

  const handleDelete = (docId: string) => {
    deleteMutation.mutate(docId)
  }

  return {
    documents,
    filteredDocuments,
    filterCategory,
    setFilterCategory,
    categories,
    showUploadModal,
    setShowUploadModal,
    selectedFile,
    setSelectedFile,
    uploadForm,
    setUploadForm,
    isSubmitting: uploadMutation.isPending,
    fileInputRef,
    handleFileSelect,
    handleUpload,
    handleToggleVisibility,
    handleDelete,
  }
}
