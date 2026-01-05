import api from '@/lib/axios'
import type { CompanyDocument } from '@/features/documents/types/documents.types'

const withAuthConfig = (token?: string) => (token ? { headers: { Authorization: `Bearer ${token}` } } : undefined)

const unwrap = <T>(res: any): T => res?.data?.data ?? res?.data ?? res

export async function getDocuments(category?: string, token?: string): Promise<CompanyDocument[]> {
  const query = category && category !== 'All' ? `?category=${encodeURIComponent(category)}` : ''
  const response = await api.get(`/documents${query}`, withAuthConfig(token))
  const docs = unwrap<CompanyDocument[]>(response)
  return Array.isArray(docs) ? docs : []
}

export async function uploadDocument(
  payload: { title: string; category: string; fileUrl: string; description?: string; type?: string },
  token?: string,
): Promise<CompanyDocument> {
  const response = await api.post('/documents', payload, withAuthConfig(token))
  return unwrap<CompanyDocument>(response)
}

export async function deleteDocument(id: string, token?: string): Promise<void> {
  await api.delete(`/documents/${id}`, withAuthConfig(token))
}
