import type { Request, Response } from 'express'
import { asyncHandler } from '../../shared/utils/async-handler'
import { HTTP_STATUS } from '../../shared/constants'
import { documentCategoryService } from './document-category.service'
import { createDocumentCategorySchema, updateDocumentCategorySchema } from './dto'

export const list = asyncHandler(async (req: any, res: Response) => {
  const includeInactive = req.query.includeInactive === 'true'
  const categories = await documentCategoryService.list(includeInactive)

  res.json({
    status: 'success',
    data: { categories },
  })
})

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const category = await documentCategoryService.getById(req.params.id)
  res.json({
    status: 'success',
    data: { category },
  })
})

export const create = asyncHandler(async (req: Request, res: Response) => {
  const { error, value } = createDocumentCategorySchema.validate(req.body)
  if (error) {
    throw new Error(error.details[0].message)
  }

  const category = await documentCategoryService.create(value)
  res.status(HTTP_STATUS.CREATED).json({
    status: 'success',
    data: { category },
  })
})

export const update = asyncHandler(async (req: Request, res: Response) => {
  const { error, value } = updateDocumentCategorySchema.validate(req.body)
  if (error) {
    throw new Error(error.details[0].message)
  }

  const category = await documentCategoryService.update(req.params.id, value)
  res.json({
    status: 'success',
    data: { category },
  })
})

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await documentCategoryService.delete(req.params.id)
  res.json({
    status: 'success',
    message: 'Category deleted successfully',
  })
})
