import { Router } from 'express'
import { Request, Response } from 'express'
import { asyncHandler } from '../middleware/errorHandler'
import { authenticate, authorize } from '../middleware/auth'
import { prisma } from '../config/database'
import { generateEmployeeNumber } from '../utils/auth'
import { employeeSchema } from '../validators'
import { validateRequest, validateParams, validateQuery } from '../middleware/validation'
import { NotFoundError, ConflictError } from '../utils/errors'
import Joi from 'joi'

const router = Router()

const paramsSchema = Joi.object({
  id: Joi.string().uuid().required(),
})

const querySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  departmentId: Joi.string().uuid().optional(),
  status: Joi.string().valid('active', 'inactive', 'terminated').optional(),
  search: Joi.string().optional(),
})

router.get(
  '/',
  authenticate,
  validateQuery(querySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, departmentId, status, search } = req.query as any
    const skip = (page - 1) * limit

    const where: any = {}
    if (departmentId) where.departmentId = departmentId
    if (status) where.status = status
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { employeeNumber: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where,
        skip,
        take: limit,
        include: {
          department: { select: { id: true, name: true } },
          role: { select: { id: true, name: true } },
          manager: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.employee.count({ where }),
    ])

    res.json({
      success: true,
      data: employees,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  })
)

router.get(
  '/:id',
  authenticate,
  validateParams(paramsSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params

    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        department: true,
        role: true,
        manager: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    })

    if (!employee) {
      throw new NotFoundError('Employee')
    }

    res.json({
      success: true,
      data: employee,
    })
  })
)

router.post(
  '/',
  authenticate,
  authorize(['super_admin', 'hr_admin']),
  validateRequest(employeeSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const employeeData = req.body
    
    const existingEmployee = await prisma.employee.findUnique({
      where: { email: employeeData.email },
    })

    if (existingEmployee) {
      throw new ConflictError('Employee with this email already exists')
    }

    const employee = await prisma.employee.create({
      data: {
        ...employeeData,
        employeeNumber: generateEmployeeNumber(),
        hireDate: new Date(employeeData.hireDate),
      },
      include: {
        department: { select: { id: true, name: true } },
        role: { select: { id: true, name: true } },
      },
    })

    res.status(201).json({
      success: true,
      data: employee,
      message: 'Employee created successfully',
    })
  })
)

router.put(
  '/:id',
  authenticate,
  authorize(['super_admin', 'hr_admin']),
  validateParams(paramsSchema),
  validateRequest(employeeSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    const employeeData = req.body

    const employee = await prisma.employee.findUnique({
      where: { id },
    })

    if (!employee) {
      throw new NotFoundError('Employee')
    }

    const updatedEmployee = await prisma.employee.update({
      where: { id },
      data: {
        ...employeeData,
        hireDate: new Date(employeeData.hireDate),
      },
      include: {
        department: { select: { id: true, name: true } },
        role: { select: { id: true, name: true } },
      },
    })

    res.json({
      success: true,
      data: updatedEmployee,
      message: 'Employee updated successfully',
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

    const employee = await prisma.employee.findUnique({
      where: { id },
    })

    if (!employee) {
      throw new NotFoundError('Employee')
    }

    await prisma.employee.update({
      where: { id },
      data: { status: 'terminated' },
    })

    res.json({
      success: true,
      message: 'Employee terminated successfully',
    })
  })
)

export default router