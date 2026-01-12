import { Router } from 'express'
import { Request, Response } from 'express'
import { asyncHandler } from '../shared/middleware/errorHandler'
import { AuthRequest, authenticate, checkPermission } from '../shared/middleware/auth'
import { prisma } from '../shared/config/database'
import Joi from 'joi'
import { requireRequestOrganizationId } from '../shared/utils/tenant'
import PDFDocument from 'pdfkit'

const router = Router()

const canExportReport = (req: AuthRequest): boolean => {
  const permissions = Array.isArray(req.user?.permissions) ? req.user?.permissions : []
  return req.user?.role === 'Super Admin' || permissions.includes('reports.export')
}

const toPdfBuffer = async (title: string, rows: Array<Record<string, unknown>>): Promise<Buffer> => {
  const doc = new PDFDocument({ margin: 40, size: 'A4' })
  const chunks: Buffer[] = []

  doc.on('data', (chunk: Buffer) => chunks.push(chunk))

  const endPromise = new Promise<Buffer>((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)
  })

  doc.fontSize(16).text(title)
  doc.moveDown(0.75)

  if (!rows.length) {
    doc.fontSize(11).text('No data')
    doc.end()
    return endPromise
  }

  const headers = Object.keys(rows[0])
  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right
  const colWidth = Math.max(60, Math.floor(pageWidth / headers.length))
  const rowHeight = 16

  let y = doc.y

  doc.fontSize(10)
  let x = doc.page.margins.left
  for (const h of headers) {
    doc.text(h, x, y, { width: colWidth, continued: false })
    x += colWidth
  }
  y += rowHeight
  doc.moveTo(doc.page.margins.left, y).lineTo(doc.page.margins.left + pageWidth, y).stroke()
  y += 6

  for (const row of rows) {
    if (y > doc.page.height - doc.page.margins.bottom - 40) {
      doc.addPage()
      y = doc.page.margins.top
    }
    x = doc.page.margins.left
    for (const h of headers) {
      const raw = (row as Record<string, unknown>)[h]
      const text = raw === null || raw === undefined ? '' : String(raw)
      doc.text(text, x, y, { width: colWidth, height: rowHeight, ellipsis: true })
      x += colWidth
    }
    y += rowHeight
  }

  doc.end()
  return endPromise
}

router.get(
  '/dashboard',
  authenticate,
  checkPermission('reports', 'view'),
  asyncHandler(async (req: Request, res: Response) => {
    const organizationId = requireRequestOrganizationId(req as unknown as AuthRequest)
    const [
      totalEmployees,
      presentToday,
      pendingLeaves,
      monthlyPayroll,
      recentActivities,
    ] = await Promise.all([
      prisma.employee.count({ where: { status: 'active', organizationId } }),
      prisma.attendance.count({
        where: {
          checkIn: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999)),
          },
          status: 'present',
          employee: {
            organizationId,
          },
        },
      }),
      prisma.leaveRequest.count({
        where: {
          status: 'pending',
          employee: {
            organizationId,
          },
        },
      }),
      prisma.payrollRecord.aggregate({
        where: {
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            lt: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1),
          },
          employee: {
            organizationId,
          },
        },
        _sum: { netSalary: true },
      }),
      prisma.employee.findMany({
        take: 5,
        where: {
          organizationId,
        },
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
  checkPermission('reports', 'view'),
  asyncHandler(async (req: Request, res: Response) => {
    const organizationId = requireRequestOrganizationId(req as unknown as AuthRequest)
    const { startDate, endDate, departmentId, format } = req.query as any

    const where: any = { organizationId }
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

    if (format === 'csv' || format === 'pdf') {
      const authReq = req as unknown as AuthRequest
      if (!canExportReport(authReq)) {
        return res.status(403).json({ success: false, message: 'Missing permission: reports.export' })
      }
      const csvData = employees.map((emp: any) => ({
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

      if (format === 'pdf') {
        const pdf = await toPdfBuffer('Employees Report', csvData)
        res.setHeader('Content-Type', 'application/pdf')
        res.setHeader('Content-Disposition', 'attachment; filename="employees.pdf"')
        return res.send(pdf)
      }

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
  checkPermission('reports', 'view'),
  asyncHandler(async (req: Request, res: Response) => {
    const organizationId = requireRequestOrganizationId(req as unknown as AuthRequest)
    const { startDate, endDate, departmentId, format } = req.query as any

    const where: any = {}
    if (startDate && endDate) {
      where.checkIn = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    }
    where.employee = {
      organizationId,
      ...(departmentId ? { departmentId } : {}),
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
      presentDays: attendance.filter((a: any) => a.status === 'present').length,
      absentDays: attendance.filter((a: any) => a.status === 'absent').length,
      lateDays: attendance.filter((a: any) => a.status === 'late').length,
      totalWorkHours: attendance.reduce((sum: number, a: any) => sum + Number(a.workHours ?? 0), 0),
      totalOvertimeHours: attendance.reduce((sum: number, a: any) => sum + Number(a.overtimeHours ?? 0), 0),
    }

    if (format === 'csv' || format === 'pdf') {
      const authReq = req as unknown as AuthRequest
      if (!canExportReport(authReq)) {
        return res.status(403).json({ success: false, message: 'Missing permission: reports.export' })
      }

      const csvData = attendance.map((a: any) => ({
        'Employee': `${a.employee?.firstName ?? ''} ${a.employee?.lastName ?? ''}`.trim(),
        'Employee Email': a.employee?.email,
        'Department': a.employee?.department?.name,
        'Check In': a.checkIn,
        'Check Out': a.checkOut,
        'Work Hours': a.workHours,
        'Overtime Hours': a.overtimeHours,
        'Status': a.status,
      }))

      if (format === 'pdf') {
        const pdf = await toPdfBuffer('Attendance Report', csvData)
        res.setHeader('Content-Type', 'application/pdf')
        res.setHeader('Content-Disposition', 'attachment; filename="attendance.pdf"')
        return res.send(pdf)
      }

      res.setHeader('Content-Type', 'text/csv')
      res.setHeader('Content-Disposition', 'attachment; filename="attendance.csv"')
      return res.send(convertToCSV(csvData))
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
  checkPermission('reports', 'view'),
  asyncHandler(async (req: Request, res: Response) => {
    const organizationId = requireRequestOrganizationId(req as unknown as AuthRequest)
    const { startDate, endDate, departmentId, format } = req.query as any

    const where: any = {}
    if (startDate && endDate) {
      where.startDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    }

    where.employee = {
      organizationId,
      ...(departmentId ? { departmentId } : {}),
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
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const summary = {
      totalRequests: leaveRequests.length,
      approvedRequests: leaveRequests.filter((lr: any) => lr.status === 'approved').length,
      pendingRequests: leaveRequests.filter((lr: any) => lr.status === 'pending').length,
      rejectedRequests: leaveRequests.filter((lr: any) => lr.status === 'rejected').length,
      totalDaysRequested: leaveRequests.reduce((sum: number, lr: any) => sum + lr.daysRequested, 0),
    }

    if (format === 'csv' || format === 'pdf') {
      const authReq = req as unknown as AuthRequest
      if (!canExportReport(authReq)) {
        return res.status(403).json({ success: false, message: 'Missing permission: reports.export' })
      }

      const csvData = leaveRequests.map((lr: any) => ({
        'Employee': `${lr.employee?.firstName ?? ''} ${lr.employee?.lastName ?? ''}`.trim(),
        'Employee Email': lr.employee?.email,
        'Department': lr.employee?.department?.name,
        'Type': lr.leaveType,
        'Start Date': lr.startDate,
        'End Date': lr.endDate,
        'Days Requested': lr.daysRequested,
        'Status': lr.status,
        'Approver': lr.approver ? `${lr.approver?.firstName ?? ''} ${lr.approver?.lastName ?? ''}`.trim() : null,
      }))

      if (format === 'pdf') {
        const pdf = await toPdfBuffer('Leave Report', csvData)
        res.setHeader('Content-Type', 'application/pdf')
        res.setHeader('Content-Disposition', 'attachment; filename="leave.pdf"')
        return res.send(pdf)
      }

      res.setHeader('Content-Type', 'text/csv')
      res.setHeader('Content-Disposition', 'attachment; filename="leave.csv"')
      return res.send(convertToCSV(csvData))
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
  checkPermission('reports', 'view'),
  asyncHandler(async (req: Request, res: Response) => {
    const organizationId = requireRequestOrganizationId(req as unknown as AuthRequest)
    const { startDate, endDate, departmentId, format } = req.query as any

    const where: any = {}
    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    }

    where.employee = {
      organizationId,
      ...(departmentId ? { departmentId } : {}),
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
      totalBaseSalary: payrollRecords.reduce((sum: number, pr: any) => sum + Number(pr.baseSalary), 0),
      totalAllowances: payrollRecords.reduce((sum: number, pr: any) => sum + Number(pr.allowances), 0),
      totalDeductions: payrollRecords.reduce((sum: number, pr: any) => sum + Number(pr.deductions), 0),
      totalNetSalary: payrollRecords.reduce((sum: number, pr: any) => sum + Number(pr.netSalary), 0),
    }

    if (format === 'csv' || format === 'pdf') {
      const authReq = req as unknown as AuthRequest
      if (!canExportReport(authReq)) {
        return res.status(403).json({ success: false, message: 'Missing permission: reports.export' })
      }

      const csvData = payrollRecords.map((pr: any) => ({
        'Employee': `${pr.employee?.firstName ?? ''} ${pr.employee?.lastName ?? ''}`.trim(),
        'Employee Email': pr.employee?.email,
        'Department': pr.employee?.department?.name,
        'Pay Period': pr.payPeriod,
        'Base Salary': pr.baseSalary,
        'Allowances': pr.allowances,
        'Deductions': pr.deductions,
        'Net Salary': pr.netSalary,
        'Status': pr.status,
      }))

      if (format === 'pdf') {
        const pdf = await toPdfBuffer('Payroll Report', csvData)
        res.setHeader('Content-Type', 'application/pdf')
        res.setHeader('Content-Disposition', 'attachment; filename="payroll.pdf"')
        return res.send(pdf)
      }

      res.setHeader('Content-Type', 'text/csv')
      res.setHeader('Content-Disposition', 'attachment; filename="payroll.csv"')
      return res.send(convertToCSV(csvData))
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