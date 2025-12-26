import { Request, Response } from 'express';
import { roleService } from './role.service';
import { asyncHandler } from '../../shared/utils/async-handler';
import { HTTP_STATUS } from '../../shared/constants';
import { prisma } from '../../shared/config/database';
import { requireRequestOrganizationId } from '../../shared/utils/tenant';

/**
 * Get all roles
 */
export const getAll = asyncHandler(async (req: Request, res: Response) => {
    const organizationId = requireRequestOrganizationId(req as any);
    const roles = await roleService.getAll(organizationId);

    res.json({
        success: true,
        data: { roles },
    });
});

/**
 * Get role by ID
 */
export const getById = asyncHandler(async (req: Request, res: Response) => {
    const organizationId = requireRequestOrganizationId(req as any);
    const role = await roleService.getById(req.params.id, organizationId);

    res.json({
        success: true,
        data: { role },
    });
});

/**
 * Create new role
 */
export const create = asyncHandler(async (req: Request, res: Response) => {
    const organizationId = requireRequestOrganizationId(req as any);
    const role = await roleService.create(req.body, organizationId);

    res.status(HTTP_STATUS.CREATED).json({
        success: true,
        data: { role },
        message: 'Role created successfully',
    });
});

/**
 * Update role
 */
export const update = asyncHandler(async (req: Request, res: Response) => {
    const organizationId = requireRequestOrganizationId(req as any);
    const role = await roleService.update(req.params.id, req.body, organizationId);

    res.json({
        success: true,
        data: { role },
        message: 'Role updated successfully',
    });
});

/**
 * Delete role
 */
export const remove = asyncHandler(async (req: Request, res: Response) => {
    const organizationId = requireRequestOrganizationId(req as any);
    await roleService.delete(req.params.id, organizationId);

    res.json({
        success: true,
        message: 'Role deleted successfully',
    });
});

/**
 * Assign role to user
 */
export const assignToUser = asyncHandler(async (req: Request, res: Response) => {
    const organizationId = requireRequestOrganizationId(req as any);
    const user = await roleService.assignToUser(req.body, organizationId);

    res.json({
        success: true,
        data: { user },
        message: 'Role assigned successfully',
    });
});

/**
 * Get users by role
 */
export const getUsersByRole = asyncHandler(async (req: Request, res: Response) => {
    const organizationId = requireRequestOrganizationId(req as any);
    const users = await roleService.getUsersByRole(req.params.id, organizationId);

    res.json({
        success: true,
        data: { users },
    });
});

/**
 * Get all available permissions
 */
export const getPermissions = asyncHandler(async (req: Request, res: Response) => {
    const permissions = await prisma.permission.findMany({
        orderBy: [
            { resource: 'asc' },
            { action: 'asc' },
        ],
    });

    const grouped = permissions.reduce((acc: Record<string, typeof permissions>, curr) => {
        if (!acc[curr.resource]) {
            acc[curr.resource] = [];
        }
        acc[curr.resource].push(curr);
        return acc;
    }, {});

    res.json({
        success: true,
        data: permissions,
        grouped,
    });
});
