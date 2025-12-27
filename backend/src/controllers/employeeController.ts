import { Request, Response, NextFunction } from 'express'
import { prisma } from '@/shared/config/database'
import { NotFoundError } from '@/shared/utils/errors'
import { requireRequestOrganizationId } from '@/shared/utils/tenant'

export const getEmployees = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const organizationId = requireRequestOrganizationId(req as any)
        const page = parseInt(req.query.page as string) || 1
        const limit = parseInt(req.query.limit as string) || 10
        const search = req.query.search as string
        const departmentId = req.query.departmentId as string
        const status = req.query.status as string

        const skip = (page - 1) * limit

        const where: any = { organizationId }

        if (search) {
            const numericSearch = Number(search)
            const isNumeric = !isNaN(numericSearch)

            const dateFromSearch = new Date(search)
            const isValidDate = !isNaN(dateFromSearch.getTime())

            const orConditions: any[] = [
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
            ]

            if (isNumeric) {
                orConditions.push({ salary: numericSearch })
            }

            if (isValidDate) {
                const startOfDay = new Date(dateFromSearch)
                startOfDay.setHours(0, 0, 0, 0)
                const endOfDay = new Date(dateFromSearch)
                endOfDay.setHours(23, 59, 59, 999)

                orConditions.push({
                    hireDate: {
                        gte: startOfDay,
                        lte: endOfDay,
                    },
                })
            }

            where.OR = orConditions
        }

        if (departmentId) {
            where.departmentId = departmentId
        }

        if (status) {
            where.status = status
        }

        const [employees, total] = await Promise.all([
            prisma.employee.findMany({
                where: where as any,
                skip,
                take: limit,
                include: {
                    department: {
                        select: { id: true, name: true },
                    },
                    role: {
                        select: { id: true, name: true },
                    },
                    user: {
                        select: { id: true, verified: true },
                    },
                },
                orderBy: { createdAt: 'desc' },
            }),
            prisma.employee.count({ where: where as any }),
        ])

        res.json({
            status: 'success',
            data: {
                employees,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit),
                },
            },
        })
    } catch (error) {
        next(error)
    }
}

export const getEmployeeById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params

        const organizationId = requireRequestOrganizationId(req as any)

        const employee = await prisma.employee.findFirst({
            where: { id, organizationId } as any,
            include: {
                department: true,
                role: true,
                user: {
                    select: { id: true, verified: true },
                },
                manager: {
                    select: { id: true, firstName: true, lastName: true },
                },
                subordinates: {
                    select: { id: true, firstName: true, lastName: true },
                },
            },
        })

        if (!employee) {
            throw new NotFoundError('Employee')
        }

        res.json({
            status: 'success',
            data: { employee },
        })
    } catch (error) {
        next(error)
    }
}

export const updateEmployee = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params
        const { firstName, lastName, departmentId, roleId, status, salary } = req.body

        const organizationId = requireRequestOrganizationId(req as any)

        const updated = await prisma.employee.updateMany({
            where: { id, organizationId } as any,
            data: {
                firstName,
                lastName,
                departmentId,
                roleId,
                status,
                salary,
            } as any,
        })

        if (!updated.count) {
            throw new NotFoundError('Employee')
        }

        const employee = await prisma.employee.findFirst({ where: { id, organizationId } as any })

        res.json({
            status: 'success',
            data: { employee },
        })
    } catch (error) {
        next(error)
    }
}

export const deleteEmployee = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params

        const organizationId = requireRequestOrganizationId(req as any)

        const employee = await prisma.employee.findFirst({
            where: { id, organizationId } as any,
            include: {
                user: true,
            },
        })

        if (!employee) {
            throw new NotFoundError('Employee')
        }

        const userId = employee.userId

        await prisma.$transaction(async (tx) => {
            // Delete the employee record first so there is no FK reference to the user
            const deleted = await tx.employee.deleteMany({ where: { id, organizationId } as any })

            if (!deleted.count) {
                return
            }

            // If this employee is linked to a user account, remove that user as well
            if (userId) {
                // Clean up any audit logs tied to this user to avoid FK constraints
                await tx.auditLog.deleteMany({ where: { userId } })

                // Password reset tokens and invites are configured with onDelete: Cascade
                await tx.user.delete({ where: { id: userId } })
            }
        })

        res.json({
            status: 'success',
            message: 'Employee deleted successfully',
        })
    } catch (error) {
        next(error)
    }
}
export const createEmployee = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { firstName, lastName, email, departmentId, roleId, hireDate, salary, status } = req.body

        const organizationId = requireRequestOrganizationId(req as any)

        const existing = await prisma.employee.findFirst({ where: { email, organizationId } as any })
        if (existing) {
            return res.status(400).json({
                success: false,
                error: { message: 'Employee with this email already exists' },
            })
        }

        if (departmentId) {
            const dept = await prisma.department.findFirst({ where: { id: departmentId, organizationId } as any })
            if (!dept) {
                return res.status(400).json({
                    success: false,
                    error: { message: 'Invalid departmentId' },
                })
            }
        }

        if (roleId) {
            const role = await prisma.role.findUnique({ where: { id: roleId } })
            if (!role) {
                return res.status(400).json({
                    success: false,
                    error: { message: 'Invalid roleId' },
                })
            }
        }

        // Generate employee number
        const count = await prisma.employee.count({ where: { organizationId } as any })
        const employeeNumber = `EMP${String(count + 1).padStart(3, '0')}`

        const salaryNumber = typeof salary === 'number' ? salary : parseFloat(String(salary))

        const employee = await prisma.employee.create({
            data: {
                employeeNumber,
                firstName,
                lastName,
                email,
                organizationId,
                departmentId,
                roleId,
                hireDate: new Date(hireDate),
                salary: salaryNumber,
                status: status || 'active',
            },
            include: {
                department: {
                    select: { id: true, name: true },
                },
                role: {
                    select: { id: true, name: true },
                },
                user: {
                    select: { id: true, verified: true },
                },
            },
        })

        res.status(201).json({
            status: 'success',
            data: { employee },
        })
    } catch (error) {
        next(error)
    }
}
