import api from '@/lib/axios'
import type { CompanyDocument, UploadCompanyDocumentPayload } from '@/features/documents/types/documents.types'

const withAuthConfig = (token?: string) => (token ? { headers: { Authorization: `Bearer ${token}` } } : undefined)
const unwrap = <T>(res: any): T => res?.data?.data ?? res?.data ?? res

export async function getCompanyDocuments(token?: string): Promise<CompanyDocument[]> {
  const res = await api.get('/documents/company', withAuthConfig(token))
  const data = unwrap<CompanyDocument[]>(res)
  return Array.isArray(data) ? data : []
}

export async function uploadCompanyDocument(
  payload: UploadCompanyDocumentPayload,
  token?: string,
): Promise<CompanyDocument> {
  const formData = new FormData()
  formData.append('file', payload.file)
  formData.append('title', payload.title)
  formData.append('category', payload.category)
  if (payload.description) formData.append('description', payload.description)

  const res = await api.post('/documents/company', formData, {
    headers: { 'Content-Type': 'multipart/form-data', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  })
  return unwrap<CompanyDocument>(res)
}

export async function deleteCompanyDocument(documentId: string, token?: string): Promise<void> {
  await api.delete(`/documents/company/${documentId}`, withAuthConfig(token))
}

export async function toggleCompanyDocumentVisibility(
  documentId: string,
  isVisible: boolean,
  token?: string,
): Promise<CompanyDocument> {
  const res = await api.patch(`/documents/company/${documentId}`, { isVisible }, withAuthConfig(token))
  return unwrap<CompanyDocument>(res)
}
