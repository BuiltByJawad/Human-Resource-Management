import { Request, Response, NextFunction } from 'express'
import { prisma } from '../config/database'
import { NotFoundError } from '../utils/errors'

export const getEmployees = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const page = parseInt(req.query.page as string) || 1
        const limit = parseInt(req.query.limit as string) || 10
        const search = req.query.search as string
        const departmentId = req.query.departmentId as string
        const status = req.query.status as string

        const skip = (page - 1) * limit

        const where: any = {}

        if (search) {
            where.OR = [
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
            ]
        }

        if (departmentId) {
            where.departmentId = departmentId
        }

        if (status) {
            where.status = status
        }

        const [employees, total] = await Promise.all([
            prisma.employee.findMany({
                where,
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
            prisma.employee.count({ where }),
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

        const employee = await prisma.employee.findUnique({
            where: { id },
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

        const employee = await prisma.employee.update({
            where: { id },
            data: {
                firstName,
                lastName,
                departmentId,
                roleId,
                status,
                salary,
            },
        })

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

        const employee = await prisma.employee.findUnique({
            where: { id },
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
            await tx.employee.delete({
                where: { id },
            })

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

        // Generate employee number
        const count = await prisma.employee.count()
        const employeeNumber = `EMP${String(count + 1).padStart(3, '0')}`

        const employee = await prisma.employee.create({
            data: {
                employeeNumber,
                firstName,
                lastName,
                email,
                departmentId,
                roleId,
                hireDate: new Date(hireDate),
                salary: parseFloat(salary),
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
