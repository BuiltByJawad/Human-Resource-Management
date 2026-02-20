export interface DocumentCategory {
  id: string
  name: string
  description?: string | null
  allowEmployeeUpload: boolean
  isActive: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface DocumentCategoriesResponse {
  data?: {
    categories?: DocumentCategory[]
  }
  categories?: DocumentCategory[]
}

export interface UpsertDocumentCategoryPayload {
  name: string
  description?: string
  allowEmployeeUpload?: boolean
  isActive?: boolean
  sortOrder?: number
}
