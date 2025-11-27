import { Router } from 'express'
import { Request, Response } from 'express'
import { asyncHandler } from '../middleware/errorHandler'
import { authenticate, authorize } from '../middleware/auth'
import { prisma } from '../config/database'
import Joi from 'joi'

const router = Router()

router.get(
  '/dashboard',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const [
      totalEmployees,
      presentToday,
      pendingLeaves,
      monthlyPayroll,
      recentActivities,
    ] = await Promise.all([
      prisma.employee.count({ where: { status: 'active' } }),
      prisma.attendance.count({
        where: {
          checkIn: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999)),
          },
          status: 'present',
        },
      }),
      prisma.leaveRequest.count({ where: { status: 'pending' } }),
      prisma.payrollRecord.aggregate({
        where: {
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            lt: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1),
          },
        },
        _sum: { netSalary: true },
      }),
      prisma.employee.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          createdAt: true,
          department: { select: { name: true } },
        },
      }),
    ])

    const formattedActivities = recentActivities.map((emp: any) => ({
      id: emp.id,
      employee: `${emp.firstName} ${emp.lastName}`,
      department: emp.department?.name,
      date: emp.createdAt,
      type: 'new_employee',
    }))

    res.json({
      success: true,
      data: {
        totalEmployees,
        presentToday,
        pendingLeaves,
        monthlyPayroll: monthlyPayroll._sum.netSalary || 0,
        recentActivities: formattedActivities,
      },
    })
  })
)

router.get(
  '/employees',
  authenticate,
  authorize(['Super Admin', 'HR Admin', 'Manager']),
  asyncHandler(async (req: Request, res: Response) => {
    const { startDate, endDate, departmentId, format } = req.query as any

    const where: any = {}
    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    }
    if (departmentId) where.departmentId = departmentId

    const employees = await prisma.employee.findMany({
      where,
      include: {
        department: { select: { name: true } },
        role: { select: { name: true } },
        _count: {
          select: {
            attendance: true,
            leaveRequests: { where: { status: 'approved' } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    if (format === 'csv') {
      const csvData = employees.map(emp => ({
        'Employee Number': emp.employeeNumber,
        'Name': `${emp.firstName} ${emp.lastName}`,
        'Email': emp.email,
        'Department': emp.department?.name,
        'Role': emp.role?.name,
        'Hire Date': emp.hireDate,
        'Salary': emp.salary,
        'Status': emp.status,
        'Attendance Count': emp._count.attendance,
        'Approved Leaves': emp._count.leaveRequests,
      }))

      res.setHeader('Content-Type', 'text/csv')
      res.setHeader('Content-Disposition', 'attachment; filename="employees.csv"')
      return res.send(convertToCSV(csvData))
    }

    res.json({
      success: true,
      data: employees,
    })
  })
)

router.get(
  '/attendance',
  authenticate,
  authorize(['Super Admin', 'HR Admin', 'Manager']),
  asyncHandler(async (req: Request, res: Response) => {
    const { startDate, endDate, departmentId } = req.query as any

    const where: any = {}
    if (startDate && endDate) {
      where.checkIn = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    }
    if (departmentId) {
      where.employee = { departmentId }
    }

    const attendance = await prisma.attendance.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            department: { select: { name: true } },
          },
        },
      },
      orderBy: { checkIn: 'desc' },
    })

    const summary = {
      totalRecords: attendance.length,
      presentDays: attendance.filter(a => a.status === 'present').length,
      absentDays: attendance.filter(a => a.status === 'absent').length,
      lateDays: attendance.filter(a => a.status === 'late').length,
      totalWorkHours: attendance.reduce((sum, a) => sum + Number(a.workHours ?? 0), 0),
      totalOvertimeHours: attendance.reduce((sum, a) => sum + Number(a.overtimeHours ?? 0), 0),
    }

    res.json({
      success: true,
      data: {
        attendance,
        summary,
      },
    })
  })
)

router.get(
  '/leave',
  authenticate,
  authorize(['Super Admin', 'HR Admin', 'Manager']),
  asyncHandler(async (req: Request, res: Response) => {
    const { startDate, endDate, departmentId } = req.query as any

    const where: any = {}
    if (startDate && endDate) {
      where.startDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    }
    if (departmentId) {
      where.employee = { departmentId }
    }

    const leaveRequests = await prisma.leaveRequest.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            department: { select: { name: true } },
          },
        },
        approver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const summary = {
      totalRequests: leaveRequests.length,
      approvedRequests: leaveRequests.filter(lr => lr.status === 'approved').length,
      pendingRequests: leaveRequests.filter(lr => lr.status === 'pending').length,
      rejectedRequests: leaveRequests.filter(lr => lr.status === 'rejected').length,
      totalDaysRequested: leaveRequests.reduce((sum, lr) => sum + lr.daysRequested, 0),
    }

    res.json({
      success: true,
      data: {
        leaveRequests,
        summary,
      },
    })
  })
)

router.get(
  '/payroll',
  authenticate,
  authorize(['Super Admin', 'HR Admin']),
  asyncHandler(async (req: Request, res: Response) => {
    const { startDate, endDate, departmentId } = req.query as any

    const where: any = {}
    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    }
    if (departmentId) {
      where.employee = { departmentId }
    }

    const payrollRecords = await prisma.payrollRecord.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            department: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const summary = {
      totalRecords: payrollRecords.length,
      totalBaseSalary: payrollRecords.reduce((sum, pr) => sum + Number(pr.baseSalary), 0),
      totalAllowances: payrollRecords.reduce((sum, pr) => sum + Number(pr.allowances), 0),
      totalDeductions: payrollRecords.reduce((sum, pr) => sum + Number(pr.deductions), 0),
      totalNetSalary: payrollRecords.reduce((sum, pr) => sum + Number(pr.netSalary), 0),
    }

    res.json({
      success: true,
      data: {
        payrollRecords,
        summary,
      },
    })
  })
)

const convertToCSV = (data: any[]): string => {
  if (data.length === 0) return ''

  const headers = Object.keys(data[0])
  const csvHeaders = headers.join(',')
  const csvRows = data.map(row =>
    headers.map(header => {
      const value = row[header]
      return typeof value === 'string' && value.includes(',') ? `"${value}"` : value
    }).join(',')
  )

  return `${csvHeaders}\n${csvRows.join('\n')}`
}

export default router