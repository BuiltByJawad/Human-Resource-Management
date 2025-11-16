import { Router } from 'express'
import { Request, Response } from 'express'
import { asyncHandler } from '../middleware/errorHandler'
import { authenticate, authorize } from '../middleware/auth'
import { prisma } from '../config/database'
import { departmentSchema } from '../validators'
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
    const departments = await prisma.department.findMany({
      include: {
        manager: { select: { id: true, firstName: true, lastName: true } },
        parentDepartment: { select: { id: true, name: true } },
        _count: {
          select: { employees: true },
        },
      },
      orderBy: { name: 'asc' },
    })

    res.json({
      success: true,
      data: departments,
    })
  })
)

router.get(
  '/:id',
  authenticate,
  validateParams(paramsSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params

    const department = await prisma.department.findUnique({
      where: { id },
      include: {
        manager: { select: { id: true, firstName: true, lastName: true } },
        parentDepartment: { select: { id: true, name: true } },
        employees: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    })

    if (!department) {
      throw new NotFoundError('Department')
    }

    res.json({
      success: true,
      data: department,
    })
  })
)

router.post(
  '/',
  authenticate,
  authorize(['super_admin', 'hr_admin']),
  validateRequest(departmentSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const departmentData = req.body

    const department = await prisma.department.create({
      data: departmentData,
    })

    res.status(201).json({
      success: true,
      data: department,
      message: 'Department created successfully',
    })
  })
)

router.put(
  '/:id',
  authenticate,
  authorize(['super_admin', 'hr_admin']),
  validateParams(paramsSchema),
  validateRequest(departmentSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    const departmentData = req.body

    const department = await prisma.department.findUnique({
      where: { id },
    })

    if (!department) {
      throw new NotFoundError('Department')
    }

    const updatedDepartment = await prisma.department.update({
      where: { id },
      data: departmentData,
    })

    res.json({
      success: true,
      data: updatedDepartment,
      message: 'Department updated successfully',
    })
  })
)

router.delete(
  '/:id',
  authenticate,
  authorize(['super_admin', 'hr_admin']),
  validateParams(paramsSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params

    const department = await prisma.department.findUnique({
      where: { id },
      include: { employees: true },
    })

    if (!department) {
      throw new NotFoundError('Department')
    }

    if (department.employees.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete department with employees',
      })
    }

    await prisma.department.delete({
      where: { id },
    })

    res.json({
      success: true,
      message: 'Department deleted successfully',
    })
  })
)

export default router