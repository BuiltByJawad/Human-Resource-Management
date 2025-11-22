import { Request, Response } from 'express'
import { asyncHandler } from '../middleware/errorHandler'
import { prisma } from '../config/database'
import { BadRequestError, NotFoundError, ConflictError } from '../utils/errors'

// @desc    Create a new role
// @route   POST /api/roles
// @access  Private (Admin)
export const createRole = asyncHandler(async (req: Request, res: Response) => {
    const { name, description, permissionIds } = req.body

    const existingRole = await prisma.role.findUnique({
        where: { name },
    })

    if (existingRole) {
        throw new ConflictError('Role with this name already exists')
    }

    const role = await prisma.role.create({
        data: {
            name,
            description,
            permissions: {
                create: permissionIds && permissionIds.length > 0
                    ? permissionIds.map((id: string) => ({ permission: { connect: { id } } }))
                    : undefined
            }
        },
        include: {
            permissions: {
                include: {
                    permission: true
                }
            }
        }
    })

    res.status(201).json({
        success: true,
        data: role,
        message: 'Role created successfully'
    })
})

// @desc    Get all roles
// @route   GET /api/roles
// @access  Private
export const getRoles = asyncHandler(async (req: Request, res: Response) => {
    const roles = await prisma.role.findMany({
        include: {
            _count: {
                select: { users: true, permissions: true }
            }
        },
        orderBy: { createdAt: 'desc' }
    })

    res.json({
        success: true,
        data: roles
    })
})

// @desc    Get role by ID
// @route   GET /api/roles/:id
// @access  Private
export const getRoleById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params

    const role = await prisma.role.findUnique({
        where: { id },
        include: {
            permissions: {
                include: {
                    permission: true
                }
            },
            _count: {
                select: { users: true }
            }
        }
    })

    if (!role) {
        throw new NotFoundError('Role not found')
    }

    res.json({
        success: true,
        data: role
    })
})

// @desc    Update role
// @route   PUT /api/roles/:id
// @access  Private (Admin)
export const updateRole = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    const { name, description, permissionIds } = req.body

    const role = await prisma.role.findUnique({ where: { id } })

    if (!role) {
        throw new NotFoundError('Role not found')
    }

    if (role.isSystem) {
        // Allow updating description/permissions but maybe not name for system roles?
        // For now, let's just block name change if it's system
        if (name && name !== role.name) {
            throw new BadRequestError('Cannot change name of system role')
        }
    }

    if (name && name !== role.name) {
        const existingName = await prisma.role.findUnique({ where: { name } })
        if (existingName) {
            throw new ConflictError('Role with this name already exists')
        }
    }

    // Transaction to update role and permissions
    const updatedRole = await prisma.$transaction(async (prisma) => {
        // If permissionIds is provided, we need to sync them
        if (permissionIds) {
            // Delete existing permissions
            await prisma.rolePermission.deleteMany({
                where: { roleId: id }
            })
        }

        return prisma.role.update({
            where: { id },
            data: {
                name,
                description,
                permissions: permissionIds ? {
                    create: permissionIds.map((pid: string) => ({ permission: { connect: { id: pid } } }))
                } : undefined
            },
            include: {
                permissions: {
                    include: {
                        permission: true
                    }
                }
            }
        })
    })

    res.json({
        success: true,
        data: updatedRole,
        message: 'Role updated successfully'
    })
})

// @desc    Delete role
// @route   DELETE /api/roles/:id
// @access  Private (Admin)
export const deleteRole = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params

    const role = await prisma.role.findUnique({
        where: { id },
        include: {
            _count: {
                select: { users: true }
            }
        }
    })

    if (!role) {
        throw new NotFoundError('Role not found')
    }

    if (role.isSystem) {
        throw new BadRequestError('Cannot delete system role')
    }

    if (role._count.users > 0) {
        throw new BadRequestError('Cannot delete role assigned to users. Reassign them first.')
    }

    await prisma.role.delete({ where: { id } })

    res.json({
        success: true,
        message: 'Role deleted successfully'
    })
})

// @desc    Get all available permissions
// @route   GET /api/roles/permissions
// @access  Private
export const getPermissions = asyncHandler(async (req: Request, res: Response) => {
    const permissions = await prisma.permission.findMany({
        orderBy: [
            { resource: 'asc' },
            { action: 'asc' }
        ]
    })

    // Group by resource for easier frontend display
    const grouped = permissions.reduce((acc: any, curr) => {
        if (!acc[curr.resource]) {
            acc[curr.resource] = []
        }
        acc[curr.resource].push(curr)
        return acc
    }, {})

    res.json({
        success: true,
        data: permissions,
        grouped
    })
})
