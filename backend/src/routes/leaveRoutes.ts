import { Router } from 'express'
import { Request, Response } from 'express'

import { asyncHandler } from '../middleware/errorHandler'
import { authenticate, authorize } from '../middleware/auth'
import { prisma } from '../config/database'
import { leaveRequestSchema } from '../validators'
import { validateRequest, validateParams, validateQuery } from '../middleware/validation'
import { NotFoundError } from '../utils/errors'
import { AuthRequest } from '../types'
import Joi from 'joi'

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
    const leaveData = req.body
    const employeeId = req.user!.id

    const startDate = new Date(leaveData.startDate)
    const endDate = new Date(leaveData.endDate)
    const daysRequested = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1

    const leaveRequest = await prisma.leaveRequest.create({
      data: {
        ...leaveData,
        employeeId,
        daysRequested,
        startDate,
        endDate,
      },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    })

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
    const approverId = req.user!.id

    const leaveRequest = await prisma.leaveRequest.findUnique({
      where: { id },
    })

    if (!leaveRequest) {
      throw new NotFoundError('Leave request')
    }

    if (leaveRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: 'Leave request has already been processed',
      })
    }

    const updatedLeaveRequest = await prisma.leaveRequest.update({
      where: { id },
      data: {
        status: 'approved',
        approverId,
      },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true, email: true } },
        approver: { select: { id: true, firstName: true, lastName: true } },
      },
    })

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
    const approverId = req.user!.id

    const leaveRequest = await prisma.leaveRequest.findUnique({
      where: { id },
    })

    if (!leaveRequest) {
      throw new NotFoundError('Leave request')
    }

    if (leaveRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: 'Leave request has already been processed',
      })
    }

    const updatedLeaveRequest = await prisma.leaveRequest.update({
      where: { id },
      data: {
        status: 'rejected',
        approverId,
      },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true, email: true } },
        approver: { select: { id: true, firstName: true, lastName: true } },
      },
    })

    res.json({
      success: true,
      data: updatedLeaveRequest,
      message: 'Leave request rejected successfully',
    })
  })
)

export default router