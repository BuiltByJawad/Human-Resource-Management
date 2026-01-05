export interface CompanyDocument {
  id: string
  title: string
  description?: string
  category: string
  fileUrl: string
  type: string
  isVisible: boolean
  uploadedBy: string
  organizationId?: string
  createdAt: string
  updatedAt: string
}

export interface UploadCompanyDocumentPayload {
  file: File
  title: string
  description?: string
  category: string
}
