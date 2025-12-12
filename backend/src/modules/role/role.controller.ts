import { Request, Response } from 'express';
import { roleService } from './role.service';
import { asyncHandler } from '../../shared/utils/async-handler';
import { HTTP_STATUS } from '../../shared/constants';

/**
 * Get all roles
 */
export const getAll = asyncHandler(async (req: Request, res: Response) => {
    const roles = await roleService.getAll();

    res.json({
        success: true,
        data: { roles },
    });
});

/**
 * Get role by ID
 */
export const getById = asyncHandler(async (req: Request, res: Response) => {
    const role = await roleService.getById(req.params.id);

    res.json({
        success: true,
        data: { role },
    });
});

/**
 * Create new role
 */
export const create = asyncHandler(async (req: Request, res: Response) => {
    const role = await roleService.create(req.body);

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
    const role = await roleService.update(req.params.id, req.body);

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
    await roleService.delete(req.params.id);

    res.json({
        success: true,
        message: 'Role deleted successfully',
    });
});

/**
 * Assign role to user
 */
export const assignToUser = asyncHandler(async (req: Request, res: Response) => {
    const user = await roleService.assignToUser(req.body);

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
    const users = await roleService.getUsersByRole(req.params.id);

    res.json({
        success: true,
        data: { users },
    });
});
