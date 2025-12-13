import { Router } from 'express'
import { Request, Response } from 'express'
import { asyncHandler } from '@/shared/middleware/errorHandler';
import { authenticate, authorize, AuthRequest } from '@/shared/middleware/auth';
import { prisma } from '@/shared/config/database';
import { attendanceSchema } from '../validators'
import { validateRequest, validateParams, validateQuery } from '../middleware/validation'
import { NotFoundError, ConflictError } from '@/shared/utils/errors';
import Joi from 'joi'
import { calculateDistance } from '@/shared/utils/geolocation';

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
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { page, limit, employeeId, startDate, endDate } = req.query as any
    const skip = (page - 1) * limit

    const where: any = {}
    // If employeeId is provided, use it. Otherwise, use the authenticated user's employeeId
    if (employeeId) {
      where.employeeId = employeeId
    } else if (req.user?.employeeId) {
      where.employeeId = req.user.employeeId
    }

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
    const employeeId = req.user!.employeeId

    if (!employeeId) {
      return res.status(400).json({
        success: false,
        error: 'User is not an employee',
      })
    }

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
    const employeeId = req.user!.employeeId
    const { latitude, longitude } = req.body

    if (!employeeId) {
      return res.status(400).json({
        success: false,
        error: 'User is not an employee',
      })
    }

    // Geofencing Validation

    if (latitude !== undefined && longitude !== undefined) {
      // Default office location (Dhaka) - in production, fetch from CompanySettings
      const officeLat = 23.8103
      const officeLon = 90.4125
      const maxDistance = 200 // meters



      const { isValid, distance } = validateLocation(
        latitude,
        longitude,
        officeLat,
        officeLon,
        maxDistance
      )



      if (!isValid) {
        return res.status(400).json({
          success: false,
          error: `You are ${distance}m away from the office. You must be within ${maxDistance}m to clock in.`,
        })
      }
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const activeAttendance = await prisma.attendance.findFirst({
      where: {
        employeeId,
        checkIn: {
          gte: today,
          lt: tomorrow,
        },
        checkOut: null
      },
      orderBy: {
        checkIn: 'desc'
      }
    })

    if (activeAttendance) {
      return res.status(400).json({
        success: false,
        error: 'You are already clocked in. Please clock out first.',
      })
    }

    const attendance = await prisma.attendance.create({
      data: {
        employeeId,
        checkIn: new Date(),
        status: 'present',
        checkInLatitude: latitude,
        checkInLongitude: longitude,
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
    const employeeId = req.user!.employeeId
    const { latitude, longitude } = req.body

    if (!employeeId) {
      return res.status(400).json({
        success: false,
        error: 'User is not an employee',
      })
    }

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
        checkOutLatitude: latitude,
        checkOutLongitude: longitude,
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