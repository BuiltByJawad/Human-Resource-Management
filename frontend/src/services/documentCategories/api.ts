import api from '@/lib/axios'
import type {
  DocumentCategory,
  DocumentCategoriesResponse,
  UpsertDocumentCategoryPayload,
} from '@/services/documentCategories/types'

const normalizeCategoryList = (payload: unknown): DocumentCategory[] => {
  if (!payload || typeof payload !== 'object') return []
  const root = (payload as DocumentCategoriesResponse).data ?? payload
  const categories = (root as { categories?: unknown }).categories
  return Array.isArray(categories) ? (categories as DocumentCategory[]) : []
}

export const fetchDocumentCategories = async (options?: { includeInactive?: boolean }, token?: string): Promise<DocumentCategory[]> => {
  const includeInactive = options?.includeInactive === true
  const res = await api.get('/document-categories', {
    params: includeInactive ? { includeInactive: 'true' } : undefined,
    ...(token ? { headers: { Authorization: `Bearer ${token}` } } : {}),
  })
  return normalizeCategoryList(res.data)
}

export const createDocumentCategory = async (payload: UpsertDocumentCategoryPayload, token?: string): Promise<DocumentCategory> => {
  const res = await api.post('/document-categories', payload, token ? { headers: { Authorization: `Bearer ${token}` } } : undefined)
  const root = res.data?.data ?? res.data
  const category = (root as { category?: DocumentCategory }).category ?? root
  return category as DocumentCategory
}

export const updateDocumentCategory = async (
  id: string,
  payload: Partial<UpsertDocumentCategoryPayload>,
  token?: string
): Promise<DocumentCategory> => {
  const res = await api.patch(`/document-categories/${id}`, payload, token ? { headers: { Authorization: `Bearer ${token}` } } : undefined)
  const root = res.data?.data ?? res.data
  const category = (root as { category?: DocumentCategory }).category ?? root
  return category as DocumentCategory
}

export const deleteDocumentCategory = async (id: string, token?: string): Promise<void> => {
  await api.delete(`/document-categories/${id}`, token ? { headers: { Authorization: `Bearer ${token}` } } : undefined)
}
