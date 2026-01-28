export interface CompanyDocument {
  id: string
  title: string
  description?: string
  category: string
  fileUrl: string
  type: string
  isVisible: boolean
  uploadedBy: string
  createdAt: string
  updatedAt: string
}

export interface DocumentUploadPayload {
  title: string
  category: string
  description?: string
  fileUrl: string
  type: string
}

export interface CompanyDocumentUploadPayload {
  title: string
  category: string
  description?: string
}
