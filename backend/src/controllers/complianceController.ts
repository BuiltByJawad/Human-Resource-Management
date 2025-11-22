import { Request, Response } from 'express'
import { asyncHandler } from '../middleware/errorHandler'
import { prisma } from '../config/database'
import { BadRequestError, NotFoundError } from '../utils/errors'
import { startOfWeek, endOfWeek, subWeeks } from 'date-fns'

// @desc    Get all compliance rules
// @route   GET /api/compliance/rules
// @access  Private
export const getRules = asyncHandler(async (req: Request, res: Response) => {
    const rules = await prisma.complianceRule.findMany({
        orderBy: { createdAt: 'desc' }
    })

    res.json({
        success: true,
        data: rules
    })
})

// @desc    Create a new compliance rule
// @route   POST /api/compliance/rules
// @access  Private (Admin)
export const createRule = asyncHandler(async (req: Request, res: Response) => {
    const { name, description, type, threshold } = req.body

    const existingRule = await prisma.complianceRule.findUnique({
        where: { name }
    })

    if (existingRule) {
        throw new BadRequestError('Rule with this name already exists')
    }

    const rule = await prisma.complianceRule.create({
        data: {
            name,
            description,
            type,
            threshold: parseInt(threshold),
            isActive: true
        }
    })

    res.status(201).json({
        success: true,
        data: rule,
        message: 'Compliance rule created successfully'
    })
})

// @desc    Toggle rule active status
// @route   PATCH /api/compliance/rules/:id/toggle
// @access  Private (Admin)
export const toggleRule = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params

    const rule = await prisma.complianceRule.findUnique({ where: { id } })
    if (!rule) throw new NotFoundError('Rule not found')

    const updatedRule = await prisma.complianceRule.update({
        where: { id },
        data: { isActive: !rule.isActive }
    })

    res.json({
        success: true,
        data: updatedRule
    })
})

// @desc    Get compliance logs (violations)
// @route   GET /api/compliance/logs
// @access  Private
export const getLogs = asyncHandler(async (req: Request, res: Response) => {
    const logs = await prisma.complianceLog.findMany({
        include: {
            rule: true,
            employee: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    department: { select: { name: true } }
                }
            }
        },
        orderBy: { violationDate: 'desc' }
    })

    res.json({
        success: true,
        data: logs
    })
})

// @desc    Run compliance check manually
// @route   POST /api/compliance/run
// @access  Private (Admin)
export const runComplianceCheck = asyncHandler(async (req: Request, res: Response) => {
    // 1. Get active rules
    const rules = await prisma.complianceRule.findMany({
        where: { isActive: true }
    })

    if (rules.length === 0) {
        return res.json({ success: true, message: 'No active rules to check' })
    }

    const violations: any[] = []
    const today = new Date()

    // 2. Iterate through rules
    for (const rule of rules) {
        if (rule.type === 'max_hours_per_week') {
            // Check last 7 days or current week
            const start = startOfWeek(today, { weekStartsOn: 1 }) // Monday
            const end = endOfWeek(today, { weekStartsOn: 1 })

            // Aggregate hours per employee
            const attendance = await prisma.attendance.groupBy({
                by: ['employeeId'],
                where: {
                    checkIn: {
                        gte: start,
                        lte: end
                    }
                },
                _sum: {
                    workHours: true
                }
            })

            // Check threshold
            for (const record of attendance) {
                const totalHours = record._sum.workHours ? Number(record._sum.workHours) : 0

                if (totalHours > rule.threshold) {
                    // Create log if not exists for this week/rule/employee
                    // Simple check: just create a log for "today" as the violation date

                    // Check if we already logged this violation for this week?
                    // For simplicity, we'll just log it. In prod, we might want to deduplicate.

                    const log = await prisma.complianceLog.create({
                        data: {
                            ruleId: rule.id,
                            employeeId: record.employeeId,
                            violationDate: today,
                            details: `Worked ${totalHours.toFixed(2)} hours (Limit: ${rule.threshold})`,
                            status: 'open'
                        }
                    })
                    violations.push(log)
                }
            }
        }
        // Add more rule types here (e.g., min_rest_period)
    }

    res.json({
        success: true,
        message: `Compliance check completed. Found ${violations.length} violations.`,
        data: violations
    })
})
