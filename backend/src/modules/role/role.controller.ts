import { Request, Response } from 'express';
import { roleService } from './role.service';
import { asyncHandler } from '../../shared/utils/async-handler';
import { HTTP_STATUS } from '../../shared/constants';
import { prisma } from '../../shared/config/database';
import { requireRequestOrganizationId } from '../../shared/utils/tenant';
import { createAuditLog } from '../../shared/utils/audit';
import { AuthRequest } from '../../shared/middleware/auth';

/**
 * Get all roles
 */
export const getAll = asyncHandler(async (req: Request, res: Response) => {
    const organizationId = requireRequestOrganizationId(req as unknown as AuthRequest);
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
    const organizationId = requireRequestOrganizationId(req as unknown as AuthRequest);
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
    const authReq = req as unknown as AuthRequest;
    const organizationId = requireRequestOrganizationId(req as unknown as AuthRequest);
    const role = await roleService.create(req.body, organizationId);

    const actorUserId = authReq.user?.id;
    const body: Record<string, unknown> =
        typeof req.body === 'object' && req.body !== null ? (req.body as Record<string, unknown>) : {};
    const name = typeof body.name === 'string' ? body.name : undefined;
    if (actorUserId) {
        await createAuditLog({
            userId: actorUserId,
            action: 'roles.create',
            resourceId: role.id,
            newValues: { roleId: role.id, name },
            req,
        });
    }

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
    const authReq = req as unknown as AuthRequest;
    const organizationId = requireRequestOrganizationId(req as unknown as AuthRequest);
    const role = await roleService.update(req.params.id, req.body, organizationId);

    const actorUserId = authReq.user?.id;
    const body: Record<string, unknown> =
        typeof req.body === 'object' && req.body !== null ? (req.body as Record<string, unknown>) : {};
    if (actorUserId) {
        await createAuditLog({
            userId: actorUserId,
            action: 'roles.update',
            resourceId: role.id,
            newValues: {
                roleId: role.id,
                updatedFields: Object.keys(body),
            },
            req,
        });
    }

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
    const authReq = req as unknown as AuthRequest;
    const organizationId = requireRequestOrganizationId(req as unknown as AuthRequest);
    await roleService.delete(req.params.id, organizationId);

    const actorUserId = authReq.user?.id;
    if (actorUserId) {
        await createAuditLog({
            userId: actorUserId,
            action: 'roles.delete',
            resourceId: req.params.id,
            req,
        });
    }

    res.json({
        success: true,
        message: 'Role deleted successfully',
    });
});

/**
 * Assign role to user
 */
export const assignToUser = asyncHandler(async (req: Request, res: Response) => {
    const authReq = req as unknown as AuthRequest;
    const organizationId = requireRequestOrganizationId(req as unknown as AuthRequest);
    const user = await roleService.assignToUser(req.body, organizationId);

    const actorUserId = authReq.user?.id;
    const body: Record<string, unknown> =
        typeof req.body === 'object' && req.body !== null ? (req.body as Record<string, unknown>) : {};
    const userId = typeof body.userId === 'string' ? body.userId : undefined;
    const roleId = typeof body.roleId === 'string' ? body.roleId : undefined;
    if (actorUserId) {
        await createAuditLog({
            userId: actorUserId,
            action: 'roles.assign_to_user',
            resourceId: user.id,
            newValues: { userId, roleId },
            req,
        });
    }

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
    const organizationId = requireRequestOrganizationId(req as unknown as AuthRequest);
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
