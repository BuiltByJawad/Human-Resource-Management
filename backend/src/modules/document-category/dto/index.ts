import Joi from 'joi'

export interface CreateDocumentCategoryDto {
  name: string
  description?: string
  allowEmployeeUpload?: boolean
  isActive?: boolean
  sortOrder?: number
}

export interface UpdateDocumentCategoryDto {
  name?: string
  description?: string | null
  allowEmployeeUpload?: boolean
  isActive?: boolean
  sortOrder?: number
}

export const createDocumentCategorySchema = Joi.object({
  name: Joi.string().trim().min(2).max(80).required(),
  description: Joi.string().trim().max(500).optional().allow(''),
  allowEmployeeUpload: Joi.boolean().default(false),
  isActive: Joi.boolean().default(true),
  sortOrder: Joi.number().integer().min(0).default(0),
})

export const updateDocumentCategorySchema = Joi.object({
  name: Joi.string().trim().min(2).max(80).optional(),
  description: Joi.string().trim().max(500).optional().allow('').allow(null),
  allowEmployeeUpload: Joi.boolean().optional(),
  isActive: Joi.boolean().optional(),
  sortOrder: Joi.number().integer().min(0).optional(),
})
