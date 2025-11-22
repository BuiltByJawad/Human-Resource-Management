import { Request, Response } from 'express'
import { asyncHandler } from '../middleware/errorHandler'
import { prisma } from '../config/database'
import { BadRequestError, NotFoundError, ConflictError } from '../utils/errors'

// @desc    Create a new department
// @route   POST /api/departments
// @access  Private (Admin)
export const createDepartment = asyncHandler(async (req: Request, res: Response) => {
    const { name, description, managerId, parentDepartmentId } = req.body

    const existingDepartment = await prisma.department.findUnique({
        where: { name },
    })

    if (existingDepartment) {
        throw new ConflictError('Department with this name already exists')
    }

    // Verify manager if provided
    if (managerId) {
        const manager = await prisma.employee.findUnique({ where: { id: managerId } })
        if (!manager) {
            throw new NotFoundError('Manager (Employee) not found')
        }
    }

    // Verify parent department if provided
    if (parentDepartmentId) {
        const parent = await prisma.department.findUnique({ where: { id: parentDepartmentId } })
        if (!parent) {
            throw new NotFoundError('Parent department not found')
        }
    }

    const department = await prisma.department.create({
        data: {
            name,
            description,
            managerId,
            parentDepartmentId,
        },
        include: {
            manager: {
                select: { id: true, firstName: true, lastName: true, email: true }
            },
            parentDepartment: {
                select: { id: true, name: true }
            }
        }
    })

    res.status(201).json({
        success: true,
        data: department,
        message: 'Department created successfully'
    })
})

// @desc    Get all departments
// @route   GET /api/departments
// @access  Private
export const getDepartments = asyncHandler(async (req: Request, res: Response) => {
    const departments = await prisma.department.findMany({
        include: {
            manager: {
                select: { id: true, firstName: true, lastName: true, email: true }
            },
            parentDepartment: {
                select: { id: true, name: true }
            },
            _count: {
                select: { employees: true, subDepartments: true }
            }
        },
        orderBy: { createdAt: 'desc' }
    })

    res.json({
        success: true,
        data: departments
    })
})

// @desc    Get department by ID
// @route   GET /api/departments/:id
// @access  Private
export const getDepartmentById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params

    const department = await prisma.department.findUnique({
        where: { id },
        include: {
            manager: {
                select: { id: true, firstName: true, lastName: true, email: true }
            },
            parentDepartment: {
                select: { id: true, name: true }
            },
            subDepartments: {
                select: { id: true, name: true, managerId: true }
            },
            employees: {
                select: { id: true, firstName: true, lastName: true, email: true },
                take: 10 // Limit employees shown in detail view
            }
        }
    })

    if (!department) {
        throw new NotFoundError('Department not found')
    }

    res.json({
        success: true,
        data: department
    })
})

// @desc    Update department
// @route   PUT /api/departments/:id
// @access  Private (Admin)
export const updateDepartment = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    const { name, description, managerId, parentDepartmentId } = req.body

    const department = await prisma.department.findUnique({ where: { id } })

    if (!department) {
        throw new NotFoundError('Department not found')
    }

    // Check name uniqueness if changing
    if (name && name !== department.name) {
        const existingName = await prisma.department.findUnique({ where: { name } })
        if (existingName) {
            throw new ConflictError('Department with this name already exists')
        }
    }

    // Prevent circular dependency
    if (parentDepartmentId && parentDepartmentId === id) {
        throw new BadRequestError('Cannot set department as its own parent')
    }

    const updatedDepartment = await prisma.department.update({
        where: { id },
        data: {
            name,
            description,
            managerId,
            parentDepartmentId,
        },
        include: {
            manager: {
                select: { id: true, firstName: true, lastName: true, email: true }
            },
            parentDepartment: {
                select: { id: true, name: true }
            }
        }
    })

    res.json({
        success: true,
        data: updatedDepartment,
        message: 'Department updated successfully'
    })
})

// @desc    Delete department
// @route   DELETE /api/departments/:id
// @access  Private (Admin)
export const deleteDepartment = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params

    const department = await prisma.department.findUnique({
        where: { id },
        include: {
            _count: {
                select: { employees: true, subDepartments: true }
            }
        }
    })

    if (!department) {
        throw new NotFoundError('Department not found')
    }

    if (department._count.employees > 0) {
        throw new BadRequestError('Cannot delete department with assigned employees. Reassign them first.')
    }

    if (department._count.subDepartments > 0) {
        throw new BadRequestError('Cannot delete department with sub-departments. Delete or reassign them first.')
    }

    await prisma.department.delete({ where: { id } })

    res.json({
        success: true,
        message: 'Department deleted successfully'
    })
})
