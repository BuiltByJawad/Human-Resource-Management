import { Router, Request, Response } from 'express'

import { asyncHandler } from '@/shared/middleware/errorHandler'
import { authenticate, authorize, AuthRequest } from '@/shared/middleware/auth'
import { prisma } from '@/shared/config/database'
import { leaveRequestSchema } from '@/validators'
import { validateRequest, validateParams, validateQuery } from '@/shared/middleware/validation'
import { NotFoundError } from '@/shared/utils/errors'
import Joi from 'joi'
import { leaveService } from '@/modules/leave/leave.service'

const router = Router()

const paramsSchema = Joi.object({
  id: Joi.string().uuid().required(),
})

const querySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  status: Joi.string().valid('pending', 'approved', 'rejected', 'cancelled').optional(),
  employeeId: Joi.string().uuid().optional(),
})

router.get(
  '/',
  authenticate,
  validateQuery(querySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, status, employeeId } = req.query as any
    const skip = (page - 1) * limit

    const where: any = {}
    if (status) where.status = status
    if (employeeId) where.employeeId = employeeId

    const [leaveRequests, total] = await Promise.all([
      prisma.leaveRequest.findMany({
        where,
        skip,
        take: limit,
        include: {
          employee: { select: { id: true, firstName: true, lastName: true, email: true } },
          approver: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.leaveRequest.count({ where }),
    ])

    res.json({
      success: true,
      data: leaveRequests,
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

    const leaveRequest = await prisma.leaveRequest.findUnique({
      where: { id },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true, email: true } },
        approver: { select: { id: true, firstName: true, lastName: true } },
      },
    })

    if (!leaveRequest) {
      throw new NotFoundError('Leave request')
    }

    res.json({
      success: true,
      data: leaveRequest,
    })
  })
)

router.post(
  '/',
  authenticate,
  validateRequest(leaveRequestSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const employeeId = req.user?.employeeId

    if (!employeeId) {
      throw new NotFoundError('Employee')
    }

    const leaveRequest = await leaveService.create(employeeId, req.body)

    res.status(201).json({
      success: true,
      data: leaveRequest,
      message: 'Leave request submitted successfully',
    })
  })
)

router.put(
  '/:id/approve',
  authenticate,
  authorize(['super_admin', 'hr_admin', 'manager']),
  validateParams(paramsSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params
    const approverId = req.user?.employeeId

    if (!approverId) {
      throw new NotFoundError('Employee')
    }

    const updatedLeaveRequest = await leaveService.approve(id, approverId, undefined)

    res.json({
      success: true,
      data: updatedLeaveRequest,
      message: 'Leave request approved successfully',
    })
  })
)

router.put(
  '/:id/reject',
  authenticate,
  authorize(['super_admin', 'hr_admin', 'manager']),
  validateParams(paramsSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params
    const approverId = req.user?.employeeId

    if (!approverId) {
      throw new NotFoundError('Employee')
    }

    const updatedLeaveRequest = await leaveService.reject(id, approverId, req.body)

    res.json({
      success: true,
      data: updatedLeaveRequest,
      message: 'Leave request rejected successfully',
    })
  })
)

export default router