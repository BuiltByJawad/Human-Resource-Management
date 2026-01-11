import { Request, Response } from 'express';
import { leaveService } from './leave.service';
import { asyncHandler } from '../../shared/utils/async-handler';
import { HTTP_STATUS } from '../../shared/constants';
import { BadRequestError, ForbiddenError } from '../../shared/utils/errors';
import { requireRequestOrganizationId } from '../../shared/utils/tenant';
import { createAuditLog } from '../../shared/utils/audit';
import { AuthRequest } from '../../shared/middleware/auth';

/**
 * Get all leave requests
 */
export const getAll = asyncHandler(async (req: Request, res: Response) => {
    const authReq = req as unknown as AuthRequest;
    const permissions: string[] = Array.isArray(authReq.user?.permissions) ? authReq.user.permissions : [];
    const canViewAll =
        permissions.includes('leave_requests.view') ||
        permissions.includes('leave_requests.approve') ||
        permissions.includes('leave_requests.manage') ||
        permissions.includes('leave_policies.manage');

    const query: Record<string, unknown> =
        typeof req.query === 'object' && req.query !== null ? ({ ...(req.query as Record<string, unknown>) } as Record<string, unknown>) : {};
    if (!canViewAll) {
        const employeeId = authReq.user?.employeeId;
        if (employeeId) {
            query.employeeId = employeeId;
        }
    }

    const organizationId = requireRequestOrganizationId(req as unknown as AuthRequest);
    const result = await leaveService.getAll(query as unknown as any, organizationId);

    res.json({
        success: true,
        data: result.leaveRequests,
        pagination: result.pagination,
    });
});

/**
 * Get leave request by ID
 */
export const getById = asyncHandler(async (req: Request, res: Response) => {
    const authReq = req as unknown as AuthRequest;
    const permissions: string[] = Array.isArray(authReq.user?.permissions) ? authReq.user.permissions : [];
    const canViewAll =
        permissions.includes('leave_requests.view') ||
        permissions.includes('leave_requests.approve') ||
        permissions.includes('leave_requests.manage') ||
        permissions.includes('leave_policies.manage');

    const organizationId = requireRequestOrganizationId(req as unknown as AuthRequest);
    const leaveRequest = await leaveService.getById(req.params.id, organizationId);
    if (!canViewAll) {
        const employeeId = authReq.user?.employeeId;
        if (!employeeId || leaveRequest.employeeId !== employeeId) {
            throw new ForbiddenError('You can only view your own leave requests');
        }
    }

    res.json({
        success: true,
        data: leaveRequest,
    });
});

/**
 * Create new leave request
 */
export const create = asyncHandler(async (req: AuthRequest, res: Response) => {
    const authReq = req;
    const employeeId = authReq.user?.employeeId;
    if (!employeeId) {
        throw new BadRequestError('Employee profile is required to request leave');
    }
    const organizationId = requireRequestOrganizationId(req as unknown as AuthRequest);
    const leaveRequest = await leaveService.create(employeeId, req.body, organizationId);

    const actorUserId = authReq.user?.id;
    if (actorUserId) {
        await createAuditLog({
            userId: actorUserId,
            action: 'leave_requests.create',
            resourceId: leaveRequest.id,
            newValues: {
                leaveRequestId: leaveRequest.id,
                employeeId: leaveRequest.employeeId,
                status: leaveRequest.status,
            },
            req,
        });
    }

    res.status(HTTP_STATUS.CREATED).json({
        success: true,
        data: leaveRequest,
        message: 'Leave request submitted successfully',
    });
});

/**
 * Update leave request
 */
export const update = asyncHandler(async (req: Request, res: Response) => {
    const authReq = req as unknown as AuthRequest;
    const permissions: string[] = Array.isArray(authReq.user?.permissions) ? authReq.user.permissions : [];
    const canManage = permissions.includes('leave_requests.manage') || permissions.includes('leave_policies.manage');
    const employeeId = authReq.user?.employeeId;

    const organizationId = requireRequestOrganizationId(req as unknown as AuthRequest);
    const existing = await leaveService.getById(req.params.id, organizationId);
    if (!canManage) {
        if (!employeeId || existing.employeeId !== employeeId) {
            throw new ForbiddenError('You can only update your own leave requests');
        }
    }

    const leaveRequest = await leaveService.update(req.params.id, req.body, organizationId);

    const actorUserId = authReq.user?.id;
    const body: Record<string, unknown> =
        typeof req.body === 'object' && req.body !== null ? (req.body as Record<string, unknown>) : {};
    if (actorUserId) {
        await createAuditLog({
            userId: actorUserId,
            action: 'leave_requests.update',
            resourceId: leaveRequest.id,
            newValues: {
                leaveRequestId: leaveRequest.id,
                updatedFields: Object.keys(body),
            },
            req,
        });
    }

    res.json({
        success: true,
        data: leaveRequest,
        message: 'Leave request updated successfully',
    });
});

/**
 * Approve leave request
 */
export const approve = asyncHandler(async (req: AuthRequest, res: Response) => {
    const authReq = req;
    const permissions: string[] = Array.isArray(authReq.user?.permissions) ? authReq.user.permissions : [];
    if (!permissions.includes('leave_requests.approve')) {
        throw new ForbiddenError('Missing permission: leave_requests.approve');
    }
    const approverId = authReq.user?.employeeId;
    if (!approverId) {
        throw new BadRequestError('Employee profile is required to approve leave');
    }
    const organizationId = requireRequestOrganizationId(req as unknown as AuthRequest);
    const leaveRequest = await leaveService.approve(req.params.id, approverId, req.body, organizationId);

    const actorUserId = authReq.user?.id;
    if (actorUserId) {
        await createAuditLog({
            userId: actorUserId,
            action: 'leave_requests.approve',
            resourceId: leaveRequest.id,
            newValues: {
                leaveRequestId: leaveRequest.id,
                status: leaveRequest.status,
                approverId: leaveRequest.approverId ?? null,
            },
            req,
        });
    }

    res.json({
        success: true,
        data: leaveRequest,
        message: 'Leave request approved successfully',
    });
});

/**
 * Reject leave request
 */
export const reject = asyncHandler(async (req: AuthRequest, res: Response) => {
    const authReq = req;
    const permissions: string[] = Array.isArray(authReq.user?.permissions) ? authReq.user.permissions : [];
    if (!permissions.includes('leave_requests.approve')) {
        throw new ForbiddenError('Missing permission: leave_requests.approve');
    }
    const approverId = authReq.user?.employeeId;
    if (!approverId) {
        throw new BadRequestError('Employee profile is required to reject leave');
    }
    const organizationId = requireRequestOrganizationId(req as unknown as AuthRequest);
    const leaveRequest = await leaveService.reject(req.params.id, approverId, req.body, organizationId);

    const actorUserId = authReq.user?.id;
    const body: Record<string, unknown> =
        typeof req.body === 'object' && req.body !== null ? (req.body as Record<string, unknown>) : {};
    const reason = typeof body.reason === 'string' ? body.reason : undefined;
    if (actorUserId) {
        await createAuditLog({
            userId: actorUserId,
            action: 'leave_requests.reject',
            resourceId: leaveRequest.id,
            newValues: {
                leaveRequestId: leaveRequest.id,
                status: leaveRequest.status,
                approverId: leaveRequest.approverId ?? null,
                reason,
            },
            req,
        });
    }

    res.json({
        success: true,
        data: leaveRequest,
        message: 'Leave request rejected successfully',
    });
});

/**
 * Cancel leave request
 */
export const cancel = asyncHandler(async (req: AuthRequest, res: Response) => {
    const authReq = req;
    const permissions: string[] = Array.isArray(authReq.user?.permissions) ? authReq.user.permissions : [];
    const canManage = permissions.includes('leave_requests.manage') || permissions.includes('leave_policies.manage');
    const employeeId = authReq.user?.employeeId;

    const organizationId = requireRequestOrganizationId(req as unknown as AuthRequest);
    const existing = await leaveService.getById(req.params.id, organizationId);
    if (!canManage) {
        if (!employeeId || existing.employeeId !== employeeId) {
            throw new ForbiddenError('You can only cancel your own leave requests');
        }
    }

    const leaveRequest = await leaveService.cancel(req.params.id, existing.employeeId, organizationId);

    const actorUserId = authReq.user?.id;
    if (actorUserId) {
        await createAuditLog({
            userId: actorUserId,
            action: 'leave_requests.cancel',
            resourceId: leaveRequest.id,
            newValues: {
                leaveRequestId: leaveRequest.id,
                status: leaveRequest.status,
            },
            req,
        });
    }

    res.json({
        success: true,
        data: leaveRequest,
        message: 'Leave request cancelled successfully',
    });
});

/**
 * Get leave balance
 */
export const getBalance = asyncHandler(async (req: AuthRequest, res: Response) => {
    const authReq = req;
    const employeeId = req.params.employeeId || authReq.user?.employeeId;
    if (!employeeId) {
        throw new BadRequestError('Employee ID is required');
    }
    const organizationId = requireRequestOrganizationId(req as unknown as AuthRequest);
    const balance = await leaveService.getLeaveBalance(employeeId, organizationId);

    res.json({
        success: true,
        data: balance,
    });
});
