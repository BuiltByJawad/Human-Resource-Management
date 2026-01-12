import { Router } from 'express'
import { Request, Response } from 'express'
import { asyncHandler } from '../shared/middleware/errorHandler'
import { AuthRequest, authenticate, checkPermission } from '../shared/middleware/auth'
import { prisma, logger } from '../shared/config/database'
import Joi from 'joi'
import { requireRequestOrganizationId } from '../shared/utils/tenant'
import PDFDocument from 'pdfkit'
import { sendEmail } from '../shared/utils/email'
import { notificationService } from '../modules/notification/notification.service'

const router = Router()

type ReportFilters = {
  startDate?: string
  endDate?: string
  departmentId?: string
}

type BuiltReport = {
  title: string
  filenameBase: string
  rows: Array<Record<string, unknown>>
}

const toFiltersObject = (value: unknown): ReportFilters => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  const obj = value as Record<string, unknown>
  const startDate = typeof obj.startDate === 'string' ? obj.startDate : undefined
  const endDate = typeof obj.endDate === 'string' ? obj.endDate : undefined
  const departmentId = typeof obj.departmentId === 'string' ? obj.departmentId : undefined
  return { startDate, endDate, departmentId }
}

const computeNextRunAt = (frequency: string, from: Date): Date => {
  const next = new Date(from)
  if (frequency === 'weekly') {
    next.setDate(next.getDate() + 7)
    return next
  }
  if (frequency === 'monthly') {
    next.setMonth(next.getMonth() + 1)
    return next
  }
  next.setDate(next.getDate() + 1)
  return next
}

const buildEmployeesReport = async (organizationId: string, filters: ReportFilters): Promise<BuiltReport> => {
  const where: any = { organizationId }
  if (filters.startDate && filters.endDate) {
    where.createdAt = {
      gte: new Date(filters.startDate),
      lte: new Date(filters.endDate),
    }
  }
  if (filters.departmentId) where.departmentId = filters.departmentId

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

  const rows = employees.map((emp: any) => ({
    'Employee Number': emp.employeeNumber,
    Name: `${emp.firstName} ${emp.lastName}`,
    Email: emp.email,
    Department: emp.department?.name,
    Role: emp.role?.name,
    'Hire Date': emp.hireDate,
    Salary: emp.salary,
    Status: emp.status,
    'Attendance Count': emp._count.attendance,
    'Approved Leaves': emp._count.leaveRequests,
  }))

  return { title: 'Employees Report', filenameBase: 'employees', rows }
}

const buildAttendanceReport = async (organizationId: string, filters: ReportFilters): Promise<BuiltReport> => {
  const where: any = {}
  if (filters.startDate && filters.endDate) {
    where.checkIn = {
      gte: new Date(filters.startDate),
      lte: new Date(filters.endDate),
    }
  }
  where.employee = {
    organizationId,
    ...(filters.departmentId ? { departmentId: filters.departmentId } : {}),
  }

  const attendance = await prisma.attendance.findMany({
    where,
    include: {
      employee: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
          department: { select: { name: true } },
        },
      },
    },
    orderBy: { checkIn: 'desc' },
  })

  const rows = attendance.map((a: any) => ({
    Employee: `${a.employee?.firstName ?? ''} ${a.employee?.lastName ?? ''}`.trim(),
    'Employee Email': a.employee?.email,
    Department: a.employee?.department?.name,
    'Check In': a.checkIn,
    'Check Out': a.checkOut,
    'Work Hours': a.workHours,
    'Overtime Hours': a.overtimeHours,
    Status: a.status,
  }))

  return { title: 'Attendance Report', filenameBase: 'attendance', rows }
}

const buildLeaveReport = async (organizationId: string, filters: ReportFilters): Promise<BuiltReport> => {
  const where: any = {}
  if (filters.startDate && filters.endDate) {
    where.startDate = {
      gte: new Date(filters.startDate),
      lte: new Date(filters.endDate),
    }
  }
  where.employee = {
    organizationId,
    ...(filters.departmentId ? { departmentId: filters.departmentId } : {}),
  }

  const leaveRequests = await prisma.leaveRequest.findMany({
    where,
    include: {
      employee: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
          department: { select: { name: true } },
        },
      },
      approver: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const rows = leaveRequests.map((lr: any) => ({
    Employee: `${lr.employee?.firstName ?? ''} ${lr.employee?.lastName ?? ''}`.trim(),
    'Employee Email': lr.employee?.email,
    Department: lr.employee?.department?.name,
    Type: lr.leaveType,
    'Start Date': lr.startDate,
    'End Date': lr.endDate,
    'Days Requested': lr.daysRequested,
    Status: lr.status,
    Approver: lr.approver ? `${lr.approver?.firstName ?? ''} ${lr.approver?.lastName ?? ''}`.trim() : null,
  }))

  return { title: 'Leave Report', filenameBase: 'leave', rows }
}

const buildPayrollReport = async (organizationId: string, filters: ReportFilters): Promise<BuiltReport> => {
  const where: any = {}
  if (filters.startDate && filters.endDate) {
    where.createdAt = {
      gte: new Date(filters.startDate),
      lte: new Date(filters.endDate),
    }
  }
  where.employee = {
    organizationId,
    ...(filters.departmentId ? { departmentId: filters.departmentId } : {}),
  }

  const payrollRecords = await prisma.payrollRecord.findMany({
    where,
    include: {
      employee: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
          department: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const rows = payrollRecords.map((pr: any) => ({
    Employee: `${pr.employee?.firstName ?? ''} ${pr.employee?.lastName ?? ''}`.trim(),
    'Employee Email': pr.employee?.email,
    Department: pr.employee?.department?.name,
    'Pay Period': pr.payPeriod,
    'Base Salary': pr.baseSalary,
    Allowances: pr.allowances,
    Deductions: pr.deductions,
    'Net Salary': pr.netSalary,
    Status: pr.status,
  }))

  return { title: 'Payroll Report', filenameBase: 'payroll', rows }
}

const buildReport = async (type: string, organizationId: string, filters: ReportFilters): Promise<BuiltReport> => {
  if (type === 'attendance') return buildAttendanceReport(organizationId, filters)
  if (type === 'leave') return buildLeaveReport(organizationId, filters)
  if (type === 'payroll') return buildPayrollReport(organizationId, filters)
  return buildEmployeesReport(organizationId, filters)
}

const canExportReport = (req: AuthRequest): boolean => {
  const permissions = Array.isArray(req.user?.permissions) ? req.user.permissions : []
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
    doc.text(h, x, y, { width: colWidth })
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

const buildAttachment = async (
  format: string,
  report: BuiltReport
): Promise<{ filename: string; content: Buffer; contentType: string }> => {
  if (format === 'pdf') {
    const pdf = await toPdfBuffer(report.title, report.rows)
    return { filename: `${report.filenameBase}.pdf`, content: pdf, contentType: 'application/pdf' }
  }

  const csvText = convertToCSV(report.rows)
  return { filename: `${report.filenameBase}.csv`, content: Buffer.from(csvText, 'utf-8'), contentType: 'text/csv' }
}

const runScheduledReport = async (scheduledReportId: string): Promise<{ deliveredCount: number }> => {
  const startedAtMs = Date.now()
  const schedule = await prisma.scheduledReport.findUnique({
    where: { id: scheduledReportId },
    include: {
      recipients: {
        include: {
          user: { select: { id: true, email: true, organizationId: true } },
        },
      },
    },
  })

  if (!schedule) {
    return { deliveredCount: 0 }
  }

  logger.info('scheduled_report.run.start', {
    scheduledReportId: schedule.id,
    organizationId: schedule.organizationId,
    format: String(schedule.format),
    type: String(schedule.type),
    frequency: String(schedule.frequency),
  })

  const run = await prisma.scheduledReportRun.create({
    data: {
      scheduledReportId: schedule.id,
      status: 'running',
      startedAt: new Date(),
    },
  })

  try {
    const filters = toFiltersObject(schedule.filters)
    const report = await buildReport(String(schedule.type), schedule.organizationId, filters)
    const attachment = await buildAttachment(String(schedule.format), report)

    const recipients = schedule.recipients
      .map((r) => r.user)
      .filter((u): u is { id: string; email: string; organizationId: string | null } => !!u && !!u.email)
      .filter((u) => u.organizationId === schedule.organizationId)

    let deliveredCount = 0

    for (const user of recipients) {
      await sendEmail({
        to: user.email,
        subject: schedule.name,
        html: `<p>Your scheduled report <strong>${schedule.name}</strong> is attached.</p>`,
        attachments: [attachment],
      })

      await notificationService.create({
        userId: user.id,
        title: 'Scheduled report delivered',
        message: schedule.name,
        type: 'reports',
        link: '/reports',
      })

      deliveredCount += 1
    }

    const nextRunAt = schedule.isEnabled ? computeNextRunAt(String(schedule.frequency), new Date()) : null

    await prisma.scheduledReport.update({
      where: { id: schedule.id },
      data: {
        lastRunAt: new Date(),
        nextRunAt,
      },
    })

    await prisma.scheduledReportRun.update({
      where: { id: run.id },
      data: {
        status: 'success',
        finishedAt: new Date(),
        deliveredCount,
      },
    })

    logger.info('scheduled_report.run.success', {
      scheduledReportId: schedule.id,
      organizationId: schedule.organizationId,
      runId: run.id,
      deliveredCount,
      durationMs: Date.now() - startedAtMs,
    })

    return { deliveredCount }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    await prisma.scheduledReportRun.update({
      where: { id: run.id },
      data: {
        status: 'failed',
        finishedAt: new Date(),
        errorMessage: message,
      },
    })

    logger.error('scheduled_report.run.failed', {
      scheduledReportId: schedule.id,
      organizationId: schedule.organizationId,
      runId: run.id,
      errorMessage: message,
      durationMs: Date.now() - startedAtMs,
    })
    throw error
  }
}

const RUN_DUE_LOCK_KEY_1 = 97421
const RUN_DUE_LOCK_KEY_2 = 40311

const tryAcquireRunDueLock = async (): Promise<boolean> => {
  const rows = await prisma.$queryRaw`SELECT pg_try_advisory_lock(${RUN_DUE_LOCK_KEY_1}, ${RUN_DUE_LOCK_KEY_2}) as locked`
  if (!Array.isArray(rows) || rows.length === 0) return false
  const first = rows[0] as { locked?: unknown }
  return first.locked === true
}

const releaseRunDueLock = async (): Promise<void> => {
  await prisma.$queryRaw`SELECT pg_advisory_unlock(${RUN_DUE_LOCK_KEY_1}, ${RUN_DUE_LOCK_KEY_2})`
}

router.get(
  '/dashboard',
  authenticate,
  checkPermission('reports', 'view'),
  asyncHandler(async (req: Request, res: Response) => {
    const organizationId = requireRequestOrganizationId(req as unknown as AuthRequest)

    const [totalEmployees, presentToday, pendingLeaves, monthlyPayroll] = await Promise.all([
      prisma.employee.count({ where: { status: 'active', organizationId } }),
      prisma.attendance.count({
        where: {
          checkIn: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999)),
          },
          status: 'present',
          employee: { organizationId },
        },
      }),
      prisma.leaveRequest.count({
        where: {
          status: 'pending',
          employee: { organizationId },
        },
      }),
      prisma.payrollRecord.aggregate({
        where: {
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            lt: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1),
          },
          employee: { organizationId },
        },
        _sum: { netSalary: true },
      }),
    ])

    res.json({
      success: true,
      data: {
        metrics: {
          totalEmployees,
          presentToday,
          pendingLeaves,
          monthlyPayroll: monthlyPayroll._sum.netSalary || 0,
        },
      },
    })
  })
)

router.get(
  '/employees',
  authenticate,
  checkPermission('reports', 'view'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const organizationId = requireRequestOrganizationId(req as unknown as AuthRequest)
    const { format, ...rest } = req.query as Record<string, unknown>
    const filters = toFiltersObject(rest)
    const report = await buildEmployeesReport(organizationId, filters)

    if (format === 'csv' || format === 'pdf') {
      if (!canExportReport(req)) {
        return res.status(403).json({ success: false, message: 'Missing permission: reports.export' })
      }
      const attachment = await buildAttachment(String(format), report)
      res.setHeader('Content-Disposition', `attachment; filename="${attachment.filename}"`)
      res.setHeader('Content-Type', attachment.contentType)
      return res.send(attachment.content)
    }

    res.json({ success: true, data: report.rows })
  })
)

router.get(
  '/attendance',
  authenticate,
  checkPermission('reports', 'view'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const organizationId = requireRequestOrganizationId(req as unknown as AuthRequest)
    const { format, ...rest } = req.query as Record<string, unknown>
    const filters = toFiltersObject(rest)

    const where: any = {}
    if (filters.startDate && filters.endDate) {
      where.checkIn = {
        gte: new Date(filters.startDate),
        lte: new Date(filters.endDate),
      }
    }
    where.employee = {
      organizationId,
      ...(filters.departmentId ? { departmentId: filters.departmentId } : {}),
    }

    const attendance = await prisma.attendance.findMany({
      where,
      include: {
        employee: {
          select: {
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
      presentDays: attendance.filter((a) => a.status === 'present').length,
      absentDays: attendance.filter((a) => a.status === 'absent').length,
      lateDays: attendance.filter((a) => a.status === 'late').length,
      totalWorkHours: attendance.reduce((sum, a) => sum + Number((a as any).workHours ?? 0), 0),
      totalOvertimeHours: attendance.reduce((sum, a) => sum + Number((a as any).overtimeHours ?? 0), 0),
    }

    if (format === 'csv' || format === 'pdf') {
      if (!canExportReport(req)) {
        return res.status(403).json({ success: false, message: 'Missing permission: reports.export' })
      }
      const report = await buildAttendanceReport(organizationId, filters)
      const attachment = await buildAttachment(String(format), report)
      res.setHeader('Content-Disposition', `attachment; filename="${attachment.filename}"`)
      res.setHeader('Content-Type', attachment.contentType)
      return res.send(attachment.content)
    }

    res.json({ success: true, data: { attendance, summary } })
  })
)

router.get(
  '/leave',
  authenticate,
  checkPermission('reports', 'view'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const organizationId = requireRequestOrganizationId(req as unknown as AuthRequest)
    const { format, ...rest } = req.query as Record<string, unknown>
    const filters = toFiltersObject(rest)

    const where: any = {}
    if (filters.startDate && filters.endDate) {
      where.startDate = {
        gte: new Date(filters.startDate),
        lte: new Date(filters.endDate),
      }
    }
    where.employee = {
      organizationId,
      ...(filters.departmentId ? { departmentId: filters.departmentId } : {}),
    }

    const leaveRequests = await prisma.leaveRequest.findMany({
      where,
      include: {
        employee: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            department: { select: { name: true } },
          },
        },
        approver: {
          select: {
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
      approvedRequests: leaveRequests.filter((lr) => lr.status === 'approved').length,
      pendingRequests: leaveRequests.filter((lr) => lr.status === 'pending').length,
      rejectedRequests: leaveRequests.filter((lr) => lr.status === 'rejected').length,
      totalDaysRequested: leaveRequests.reduce((sum, lr) => sum + Number((lr as any).daysRequested ?? 0), 0),
    }

    if (format === 'csv' || format === 'pdf') {
      if (!canExportReport(req)) {
        return res.status(403).json({ success: false, message: 'Missing permission: reports.export' })
      }
      const report = await buildLeaveReport(organizationId, filters)
      const attachment = await buildAttachment(String(format), report)
      res.setHeader('Content-Disposition', `attachment; filename="${attachment.filename}"`)
      res.setHeader('Content-Type', attachment.contentType)
      return res.send(attachment.content)
    }

    res.json({ success: true, data: { leaveRequests, summary } })
  })
)

router.get(
  '/payroll',
  authenticate,
  checkPermission('reports', 'view'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const organizationId = requireRequestOrganizationId(req as unknown as AuthRequest)
    const { format, ...rest } = req.query as Record<string, unknown>
    const filters = toFiltersObject(rest)

    const where: any = {}
    if (filters.startDate && filters.endDate) {
      where.createdAt = {
        gte: new Date(filters.startDate),
        lte: new Date(filters.endDate),
      }
    }
    where.employee = {
      organizationId,
      ...(filters.departmentId ? { departmentId: filters.departmentId } : {}),
    }

    const payrollRecords = await prisma.payrollRecord.findMany({
      where,
      include: {
        employee: {
          select: {
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
      totalBaseSalary: payrollRecords.reduce((sum, pr) => sum + Number((pr as any).baseSalary ?? 0), 0),
      totalAllowances: payrollRecords.reduce((sum, pr) => sum + Number((pr as any).allowances ?? 0), 0),
      totalDeductions: payrollRecords.reduce((sum, pr) => sum + Number((pr as any).deductions ?? 0), 0),
      totalNetSalary: payrollRecords.reduce((sum, pr) => sum + Number((pr as any).netSalary ?? 0), 0),
    }

    if (format === 'csv' || format === 'pdf') {
      if (!canExportReport(req)) {
        return res.status(403).json({ success: false, message: 'Missing permission: reports.export' })
      }
      const report = await buildPayrollReport(organizationId, filters)
      const attachment = await buildAttachment(String(format), report)
      res.setHeader('Content-Disposition', `attachment; filename="${attachment.filename}"`)
      res.setHeader('Content-Type', attachment.contentType)
      return res.send(attachment.content)
    }

    res.json({ success: true, data: { payrollRecords, summary } })
  })
)

const scheduleSchema = Joi.object({
  name: Joi.string().max(160).required(),
  type: Joi.string().valid('employees', 'attendance', 'leave', 'payroll').required(),
  format: Joi.string().valid('csv', 'pdf').required(),
  frequency: Joi.string().valid('daily', 'weekly', 'monthly').required(),
  filters: Joi.object({
    startDate: Joi.string().isoDate().optional(),
    endDate: Joi.string().isoDate().optional(),
    departmentId: Joi.string().optional(),
  }).optional(),
  recipientUserIds: Joi.array().items(Joi.string().uuid()).min(1).required(),
  isEnabled: Joi.boolean().optional(),
}).required()

router.get(
  '/schedules',
  authenticate,
  checkPermission('reports', 'configure'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const organizationId = requireRequestOrganizationId(req as unknown as AuthRequest)
    const schedules = await prisma.scheduledReport.findMany({
      where: { organizationId },
      include: {
        recipients: {
          include: {
            user: { select: { id: true, email: true, firstName: true, lastName: true } },
          },
        },
        runs: { take: 5, orderBy: { createdAt: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
    })

    res.json({ success: true, data: schedules })
  })
)

router.get(
  '/schedules/recipients',
  authenticate,
  checkPermission('reports', 'configure'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const organizationId = requireRequestOrganizationId(req as unknown as AuthRequest)
    const users = await prisma.user.findMany({
      where: { organizationId, status: 'active' },
      select: { id: true, email: true, firstName: true, lastName: true },
      orderBy: { createdAt: 'desc' },
      take: 200,
    })
    res.json({ success: true, data: users })
  })
)

router.get(
  '/schedules/:id',
  authenticate,
  checkPermission('reports', 'configure'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const organizationId = requireRequestOrganizationId(req as unknown as AuthRequest)
    const schedule = await prisma.scheduledReport.findFirst({
      where: { id: req.params.id, organizationId },
      include: {
        recipients: {
          include: {
            user: { select: { id: true, email: true, firstName: true, lastName: true } },
          },
        },
        runs: { take: 20, orderBy: { createdAt: 'desc' } },
      },
    })

    res.json({ success: true, data: schedule })
  })
)

router.post(
  '/schedules',
  authenticate,
  checkPermission('reports', 'configure'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const organizationId = requireRequestOrganizationId(req as unknown as AuthRequest)
    const actorUserId = req.user?.id
    const { error, value } = scheduleSchema.validate(req.body, { abortEarly: false, stripUnknown: true })
    if (error) {
      return res.status(400).json({ success: false, message: error.message })
    }
    if (!actorUserId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' })
    }

    const recipientUserIds: string[] = Array.isArray(value.recipientUserIds) ? value.recipientUserIds : []
    const users = await prisma.user.findMany({
      where: { id: { in: recipientUserIds }, organizationId },
      select: { id: true },
    })
    const validRecipientIds = users.map((u) => u.id)
    if (!validRecipientIds.length) {
      return res.status(400).json({ success: false, message: 'No valid recipients found for this organization' })
    }

    const now = new Date()
    const nextRunAt = value.isEnabled === false ? null : computeNextRunAt(String(value.frequency), now)

    const created = await prisma.scheduledReport.create({
      data: {
        organizationId,
        name: value.name,
        type: value.type,
        format: value.format,
        frequency: value.frequency,
        filters: value.filters ?? undefined,
        isEnabled: value.isEnabled === undefined ? true : Boolean(value.isEnabled),
        nextRunAt,
        createdByUserId: actorUserId,
        recipients: {
          create: validRecipientIds.map((id) => ({ userId: id })),
        },
      },
      include: {
        recipients: { include: { user: { select: { id: true, email: true } } } },
      },
    })

    res.json({ success: true, data: created })
  })
)

router.put(
  '/schedules/:id',
  authenticate,
  checkPermission('reports', 'configure'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const organizationId = requireRequestOrganizationId(req as unknown as AuthRequest)
    const { error, value } = scheduleSchema.validate(req.body, { abortEarly: false, stripUnknown: true })
    if (error) {
      return res.status(400).json({ success: false, message: error.message })
    }

    const schedule = await prisma.scheduledReport.findFirst({ where: { id: req.params.id, organizationId } })
    if (!schedule) {
      return res.status(404).json({ success: false, message: 'Schedule not found' })
    }

    const recipientUserIds: string[] = Array.isArray(value.recipientUserIds) ? value.recipientUserIds : []
    const users = await prisma.user.findMany({
      where: { id: { in: recipientUserIds }, organizationId },
      select: { id: true },
    })
    const validRecipientIds = users.map((u) => u.id)
    if (!validRecipientIds.length) {
      return res.status(400).json({ success: false, message: 'No valid recipients found for this organization' })
    }

    const now = new Date()
    const nextRunAt = value.isEnabled === false ? null : computeNextRunAt(String(value.frequency), now)

    const updated = await prisma.scheduledReport.update({
      where: { id: schedule.id },
      data: {
        name: value.name,
        type: value.type,
        format: value.format,
        frequency: value.frequency,
        filters: value.filters ?? undefined,
        isEnabled: value.isEnabled === undefined ? schedule.isEnabled : Boolean(value.isEnabled),
        nextRunAt,
        recipients: {
          deleteMany: {},
          create: validRecipientIds.map((id) => ({ userId: id })),
        },
      },
      include: {
        recipients: { include: { user: { select: { id: true, email: true } } } },
      },
    })

    res.json({ success: true, data: updated })
  })
)

router.patch(
  '/schedules/:id/enabled',
  authenticate,
  checkPermission('reports', 'configure'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const organizationId = requireRequestOrganizationId(req as unknown as AuthRequest)
    const { isEnabled } = req.body as { isEnabled?: boolean }

    if (typeof isEnabled !== 'boolean') {
      return res.status(400).json({ success: false, message: 'isEnabled must be a boolean' })
    }

    const schedule = await prisma.scheduledReport.findFirst({ where: { id: req.params.id, organizationId } })
    if (!schedule) {
      return res.status(404).json({ success: false, message: 'Schedule not found' })
    }

    const nextRunAt = isEnabled ? computeNextRunAt(String(schedule.frequency), new Date()) : null
    const updated = await prisma.scheduledReport.update({
      where: { id: schedule.id },
      data: {
        isEnabled,
        nextRunAt,
      },
      include: {
        recipients: {
          include: {
            user: { select: { id: true, email: true, firstName: true, lastName: true } },
          },
        },
        runs: { take: 5, orderBy: { createdAt: 'desc' } },
      },
    })

    res.json({ success: true, data: updated })
  })
)

router.delete(
  '/schedules/:id',
  authenticate,
  checkPermission('reports', 'configure'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const organizationId = requireRequestOrganizationId(req as unknown as AuthRequest)
    const schedule = await prisma.scheduledReport.findFirst({ where: { id: req.params.id, organizationId } })
    if (!schedule) {
      return res.status(404).json({ success: false, message: 'Schedule not found' })
    }

    await prisma.scheduledReport.delete({ where: { id: schedule.id } })
    res.json({ success: true })
  })
)

router.post(
  '/schedules/:id/run-now',
  authenticate,
  checkPermission('reports', 'configure'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const organizationId = requireRequestOrganizationId(req as unknown as AuthRequest)
    const schedule = await prisma.scheduledReport.findFirst({ where: { id: req.params.id, organizationId } })
    if (!schedule) {
      return res.status(404).json({ success: false, message: 'Schedule not found' })
    }
    const result = await runScheduledReport(schedule.id)
    res.json({ success: true, data: result })
  })
)

router.post(
  '/schedules/run-due',
  asyncHandler(async (req: Request, res: Response) => {
    const token = req.header('X-Report-Scheduler-Token')
    const expected = process.env.REPORT_SCHEDULER_TOKEN
    if (!expected || token !== expected) {
      return res.status(401).json({ success: false, message: 'Unauthorized' })
    }

    const lockAcquired = await tryAcquireRunDueLock()
    if (!lockAcquired) {
      logger.warn('scheduled_report.run_due.lock_busy')
      return res.json({ success: true, data: { ran: 0, skipped: true } })
    }

    const startedAtMs = Date.now()
    try {
      const now = new Date()
      const due = await prisma.scheduledReport.findMany({
        where: {
          isEnabled: true,
          nextRunAt: { lte: now },
        },
        select: { id: true },
        take: 25,
      })

      logger.info('scheduled_report.run_due.start', { dueCount: due.length })

      let ran = 0
      let failed = 0
      for (const s of due) {
        try {
          await runScheduledReport(s.id)
          ran += 1
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : 'Unknown error'
          logger.error('scheduled_report.run_due.item_failed', { scheduledReportId: s.id, errorMessage: message })
          failed += 1
        }
      }

      logger.info('scheduled_report.run_due.finish', {
        ran,
        failed,
        durationMs: Date.now() - startedAtMs,
      })

      res.json({ success: true, data: { ran, failed } })
    } finally {
      await releaseRunDueLock()
    }
  })
)

const convertToCSV = (data: Array<Record<string, unknown>>): string => {
  if (data.length === 0) return ''

  const headers = Object.keys(data[0])
  const csvHeaders = headers.join(',')
  const csvRows = data.map((row) =>
    headers
      .map((header) => {
        const value = row[header]
        const text = value === null || value === undefined ? '' : String(value)
        return text.includes(',') ? `"${text}"` : text
      })
      .join(',')
  )

  return `${csvHeaders}\n${csvRows.join('\n')}`
}

export default router