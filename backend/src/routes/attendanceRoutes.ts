import { Router } from 'express'
import { Request, Response } from 'express'
import { asyncHandler } from '../middleware/errorHandler'
import { authenticate, authorize } from '../middleware/auth'
import { prisma } from '../config/database'
import { attendanceSchema } from '../validators'
import { validateRequest, validateParams, validateQuery } from '../middleware/validation'
import { NotFoundError, ConflictError } from '../utils/errors'
import { AuthRequest } from '../types'
import Joi from 'joi'

const router = Router()

const paramsSchema = Joi.object({
  id: Joi.string().uuid().required(),
})

const querySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  employeeId: Joi.string().uuid().optional(),
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional(),
})

router.get(
  '/',
  authenticate,
  validateQuery(querySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, employeeId, startDate, endDate } = req.query as any
    const skip = (page - 1) * limit

    const where: any = {}
    if (employeeId) where.employeeId = employeeId
    if (startDate && endDate) {
      where.checkIn = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    }

    const [attendanceRecords, total] = await Promise.all([
      prisma.attendance.findMany({
        where,
        skip,
        take: limit,
        include: {
          employee: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
        orderBy: { checkIn: 'desc' },
      }),
      prisma.attendance.count({ where }),
    ])

    res.json({
      success: true,
      data: attendanceRecords,
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

    const attendance = await prisma.attendance.findUnique({
      where: { id },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    })

    if (!attendance) {
      throw new NotFoundError('Attendance record')
    }

    res.json({
      success: true,
      data: attendance,
    })
  })
)

router.post(
  '/',
  authenticate,
  validateRequest(attendanceSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const attendanceData = req.body
    const employeeId = req.user!.id

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const existingAttendance = await prisma.attendance.findFirst({
      where: {
        employeeId,
        checkIn: {
          gte: today,
          lt: tomorrow,
        },
      },
    })

    if (existingAttendance) {
      return res.status(400).json({
        success: false,
        error: 'Attendance already recorded for today',
      })
    }

    const attendance = await prisma.attendance.create({
      data: {
        ...attendanceData,
        employeeId,
        checkIn: new Date(attendanceData.checkIn),
        checkOut: attendanceData.checkOut ? new Date(attendanceData.checkOut) : undefined,
      },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    })

    res.status(201).json({
      success: true,
      data: attendance,
      message: 'Attendance recorded successfully',
    })
  })
)

router.put(
  '/:id',
  authenticate,
  validateParams(paramsSchema),
  validateRequest(attendanceSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    const attendanceData = req.body

    const attendance = await prisma.attendance.findUnique({
      where: { id },
    })

    if (!attendance) {
      throw new NotFoundError('Attendance record')
    }

    const updatedAttendance = await prisma.attendance.update({
      where: { id },
      data: {
        ...attendanceData,
        checkIn: new Date(attendanceData.checkIn),
        checkOut: attendanceData.checkOut ? new Date(attendanceData.checkOut) : undefined,
      },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    })

    res.json({
      success: true,
      data: updatedAttendance,
      message: 'Attendance updated successfully',
    })
  })
)

router.post(
  '/clock-in',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const employeeId = req.user!.id

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const existingAttendance = await prisma.attendance.findFirst({
      where: {
        employeeId,
        checkIn: {
          gte: today,
          lt: tomorrow,
        },
      },
    })

    if (existingAttendance) {
      return res.status(400).json({
        success: false,
        error: 'Already clocked in today',
      })
    }

    const attendance = await prisma.attendance.create({
      data: {
        employeeId,
        checkIn: new Date(),
        status: 'present',
      },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    })

    res.status(201).json({
      success: true,
      data: attendance,
      message: 'Clocked in successfully',
    })
  })
)

router.put(
  '/clock-out/:id',
  authenticate,
  validateParams(paramsSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params
    const employeeId = req.user!.id

    const attendance = await prisma.attendance.findFirst({
      where: { id, employeeId },
    })

    if (!attendance) {
      throw new NotFoundError('Attendance record')
    }

    if (attendance.checkOut) {
      return res.status(400).json({
        success: false,
        error: 'Already clocked out',
      })
    }

    const checkOut = new Date()
    const workHours = Math.round((checkOut.getTime() - attendance.checkIn.getTime()) / (1000 * 60 * 60) * 100) / 100

    const updatedAttendance = await prisma.attendance.update({
      where: { id },
      data: {
        checkOut,
        workHours,
      },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    })

    res.json({
      success: true,
      data: updatedAttendance,
      message: 'Clocked out successfully',
    })
  })
)

export default router