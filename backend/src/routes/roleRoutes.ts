import { Router } from 'express'
import { Request, Response } from 'express'
import { asyncHandler } from '../middleware/errorHandler'
import { authenticate, authorize } from '../middleware/auth'
import { prisma } from '../config/database'
import { roleSchema } from '../validators'
import { validateRequest, validateParams, validateQuery } from '../middleware/validation'
import { NotFoundError, ConflictError } from '../utils/errors'
import { AuthRequest } from '../types'
import Joi from 'joi'

const router = Router()

const paramsSchema = Joi.object({
  id: Joi.string().uuid().required(),
})

router.get(
  '/',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const roles = await prisma.role.findMany({
      include: {
        _count: {
          select: { employees: true },
        },
      },
      orderBy: { name: 'asc' },
    })

    res.json({
      success: true,
      data: roles,
    })
  })
)

router.get(
  '/:id',
  authenticate,
  validateParams(paramsSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params

    const role = await prisma.role.findUnique({
      where: { id },
      include: {
        employees: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    })

    if (!role) {
      throw new NotFoundError('Role')
    }

    res.json({
      success: true,
      data: role,
    })
  })
)

router.post(
  '/',
  authenticate,
  authorize(['super_admin']),
  validateRequest(roleSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const roleData = req.body

    const role = await prisma.role.create({
      data: roleData,
    })

    res.status(201).json({
      success: true,
      data: role,
      message: 'Role created successfully',
    })
  })
)

router.put(
  '/:id',
  authenticate,
  authorize(['super_admin']),
  validateParams(paramsSchema),
  validateRequest(roleSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    const roleData = req.body

    const role = await prisma.role.findUnique({
      where: { id },
    })

    if (!role) {
      throw new NotFoundError('Role')
    }

    const updatedRole = await prisma.role.update({
      where: { id },
      data: roleData,
    })

    res.json({
      success: true,
      data: updatedRole,
      message: 'Role updated successfully',
    })
  })
)

router.delete(
  '/:id',
  authenticate,
  authorize(['super_admin']),
  validateParams(paramsSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params

    const role = await prisma.role.findUnique({
      where: { id },
      include: { employees: true },
    })

    if (!role) {
      throw new NotFoundError('Role')
    }

    if (role.employees.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete role with assigned employees',
      })
    }

    await prisma.role.delete({
      where: { id },
    })

    res.json({
      success: true,
      message: 'Role deleted successfully',
    })
  })
)

export default router