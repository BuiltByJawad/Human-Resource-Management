import api from '@/lib/axios'
import type { CompanyDocument, CompanyDocumentUploadPayload, DocumentUploadPayload } from '@/services/documents/types'

const buildApiBase = () =>
  process.env.BACKEND_URL ||
  (process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api$/, '') : null) ||
  'http://localhost:5000'

const fetchWithToken = async <T>(path: string, token: string | null): Promise<T | null> => {
  if (!token) return null
  try {
    const base = buildApiBase()
    const response = await fetch(`${base}${path}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    })
    if (!response.ok) return null
    const payload = await response.json().catch(() => null)
    return (payload?.data ?? payload ?? null) as T | null
  } catch {
    return null
  }
}

export const fetchCompanyDocumentsServer = async (token: string | null): Promise<CompanyDocument[]> => {
  const data = await fetchWithToken<CompanyDocument[]>('/api/documents/company', token)
  return Array.isArray(data) ? data : []
}

export const fetchEmployeeDocumentsServer = async (token: string | null): Promise<CompanyDocument[]> => {
  const data = await fetchWithToken<CompanyDocument[]>('/api/documents', token)
  return Array.isArray(data) ? data : []
}

export const fetchCompanyDocuments = async (): Promise<CompanyDocument[]> => {
  try {
    const response = await api.get<{ data: CompanyDocument[] }>('/documents/company')
    return Array.isArray(response.data?.data) ? response.data.data : []
  } catch {
    return []
  }
}

export const fetchDocuments = async (category?: string): Promise<CompanyDocument[]> => {
  const query = category ? `?category=${category}` : ''
  const response = await api.get<{ data: CompanyDocument[] }>(`/documents${query}`)
  return Array.isArray(response.data?.data) ? response.data.data : []
}

export const uploadCompanyDocument = async (file: File, payload: CompanyDocumentUploadPayload) => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('title', payload.title)
  formData.append('category', payload.category)
  if (payload.description) formData.append('description', payload.description)

  const response = await api.post('/documents/company', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data
}

export const uploadDocument = async (payload: DocumentUploadPayload) => {
  const response = await api.post('/documents', payload)
  return response.data
}

export const deleteCompanyDocument = async (documentId: string) => {
  const response = await api.delete(`/documents/company/${documentId}`)
  return response.data
}

export const deleteDocument = async (documentId: string) => {
  const response = await api.delete(`/documents/${documentId}`)
  return response.data
}

export const toggleDocumentVisibility = async (documentId: string, isVisible: boolean) => {
  const response = await api.patch(`/documents/company/${documentId}`, { isVisible })
  return response.data
}
