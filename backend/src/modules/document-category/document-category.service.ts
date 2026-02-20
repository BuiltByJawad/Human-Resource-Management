import { NotFoundError } from '../../shared/utils/errors'
import { documentCategoryRepository } from './document-category.repository'
import type { CreateDocumentCategoryDto, UpdateDocumentCategoryDto } from './dto'

export class DocumentCategoryService {
  async list(includeInactive: boolean) {
    return documentCategoryRepository.findAll(includeInactive)
  }

  async getById(id: string) {
    const category = await documentCategoryRepository.findById(id)
    if (!category) throw new NotFoundError('Category not found')
    return category
  }

  async create(dto: CreateDocumentCategoryDto) {
    return documentCategoryRepository.create({
      name: dto.name,
      description: dto.description?.trim() ? dto.description.trim() : undefined,
      allowEmployeeUpload: dto.allowEmployeeUpload === true,
      isActive: dto.isActive !== false,
      sortOrder: typeof dto.sortOrder === 'number' ? dto.sortOrder : 0,
    })
  }

  async update(id: string, dto: UpdateDocumentCategoryDto) {
    await this.getById(id)

    const updated = await documentCategoryRepository.update(id, {
      name: typeof dto.name === 'string' ? dto.name : undefined,
      description: typeof dto.description === 'string' ? (dto.description.trim() ? dto.description.trim() : null) : dto.description,
      allowEmployeeUpload: typeof dto.allowEmployeeUpload === 'boolean' ? dto.allowEmployeeUpload : undefined,
      isActive: typeof dto.isActive === 'boolean' ? dto.isActive : undefined,
      sortOrder: typeof dto.sortOrder === 'number' ? dto.sortOrder : undefined,
    })

    if (!updated) throw new NotFoundError('Category not found')
    return updated
  }

  async delete(id: string) {
    await this.getById(id)
    await documentCategoryRepository.delete(id)
  }
}

export const documentCategoryService = new DocumentCategoryService()
