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
        })

        if (!employee) {
            throw new NotFoundError('Employee')
        }

        await prisma.employee.delete({
            where: { id },
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
        })

        res.status(201).json({
            status: 'success',
            data: { employee },
        })
    } catch (error) {
        next(error)
    }
}
