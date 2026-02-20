import { prisma } from '../../shared/config/database'
import type { DocumentCategory } from '@prisma/client'

export class DocumentCategoryRepository {
  async findAll(includeInactive: boolean): Promise<DocumentCategory[]> {
    return prisma.documentCategory.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    })
  }

  async findById(id: string): Promise<DocumentCategory | null> {
    return prisma.documentCategory.findUnique({ where: { id } })
  }

  async findByName(name: string): Promise<DocumentCategory | null> {
    return prisma.documentCategory.findUnique({ where: { name } })
  }

  async create(data: {
    name: string
    description?: string
    allowEmployeeUpload: boolean
    isActive: boolean
    sortOrder: number
  }): Promise<DocumentCategory> {
    return prisma.documentCategory.create({
      data: {
        name: data.name,
        description: data.description,
        allowEmployeeUpload: data.allowEmployeeUpload,
        isActive: data.isActive,
        sortOrder: data.sortOrder,
      },
    })
  }

  async update(
    id: string,
    data: {
      name?: string
      description?: string | null
      allowEmployeeUpload?: boolean
      isActive?: boolean
      sortOrder?: number
    }
  ): Promise<DocumentCategory | null> {
    const result = await prisma.documentCategory.updateMany({
      where: { id },
      data,
    })

    if (!result.count) {
      return null
    }

    return prisma.documentCategory.findUnique({ where: { id } })
  }

  async delete(id: string): Promise<number> {
    const result = await prisma.documentCategory.deleteMany({ where: { id } })
    return result.count
  }
}

export const documentCategoryRepository = new DocumentCategoryRepository()
