import { Request, Response } from 'express';
import { employeeService } from './employee.service';
import { asyncHandler } from '../../shared/utils/async-handler';
import { HTTP_STATUS } from '../../shared/constants';
import { createAuditLog } from '../../shared/utils/audit';
import { AuthRequest } from '../../shared/middleware/auth';

/**
 * Get all employees with pagination and filters
 */
export const getAll = asyncHandler(async (req: Request, res: Response) => {
    const result = await employeeService.getAll(req.query, '');

    res.json({
        status: 'success',
        data: result,
    });
});

/**
 * Get employee by ID
 */
export const getById = asyncHandler(async (req: Request, res: Response) => {
    const employee = await employeeService.getById(req.params.id, '');

    res.json({
        status: 'success',
        data: { employee },
    });
});

/**
 * Create new employee
 */
export const create = asyncHandler(async (req: Request, res: Response) => {
    const employee = await employeeService.create(req.body, '');

    const authReq = req as unknown as AuthRequest;
    const actorUserId = authReq.user?.id;
    const body: Record<string, unknown> =
        typeof req.body === 'object' && req.body !== null ? (req.body as Record<string, unknown>) : {};
    const departmentId = typeof body.departmentId === 'string' ? body.departmentId : undefined;
    const roleId = typeof body.roleId === 'string' ? body.roleId : undefined;
    const status = typeof body.status === 'string' ? body.status : undefined;
    if (actorUserId) {
        await createAuditLog({
            userId: actorUserId,
            action: 'employees.create',
            resourceId: employee.id,
            newValues: {
                employeeId: employee.id,
                departmentId,
                roleId,
                status,
            },
            req,
        });
    }

    res.status(HTTP_STATUS.CREATED).json({
        status: 'success',
        data: { employee },
    });
});

/**
 * Update employee
 */
export const update = asyncHandler(async (req: Request, res: Response) => {
    const employee = await employeeService.update(req.params.id, req.body, '');

    const authReq = req as unknown as AuthRequest;
    const actorUserId = authReq.user?.id;
    const body: Record<string, unknown> =
        typeof req.body === 'object' && req.body !== null ? (req.body as Record<string, unknown>) : {};
    if (actorUserId) {
        await createAuditLog({
            userId: actorUserId,
            action: 'employees.update',
            resourceId: employee.id,
            newValues: {
                employeeId: employee.id,
                updatedFields: Object.keys(body),
            },
            req,
        });
    }

    res.json({
        status: 'success',
        data: { employee },
    });
});

/**
 * Delete employee
 */
export const remove = asyncHandler(async (req: Request, res: Response) => {
    await employeeService.delete(req.params.id, '');

    const authReq = req as unknown as AuthRequest;
    const actorUserId = authReq.user?.id;
    if (actorUserId) {
        await createAuditLog({
            userId: actorUserId,
            action: 'employees.delete',
            resourceId: req.params.id,
            req,
        });
    }

    res.json({
        status: 'success',
        message: 'Employee deleted successfully',
    });
});
