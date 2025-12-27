import { Request, Response } from 'express';
import { leaveService } from './leave.service';
import { asyncHandler } from '../../shared/utils/async-handler';
import { HTTP_STATUS } from '../../shared/constants';
import { ForbiddenError } from '../../shared/utils/errors';
import { requireRequestOrganizationId } from '../../shared/utils/tenant';

/**
 * Get all leave requests
 */
export const getAll = asyncHandler(async (req: Request, res: Response) => {
    const authReq: any = req as any;
    const permissions: string[] = Array.isArray(authReq?.user?.permissions) ? authReq.user.permissions : [];
    const canViewAll =
        permissions.includes('leave_requests.view') ||
        permissions.includes('leave_requests.approve') ||
        permissions.includes('leave_requests.manage') ||
        permissions.includes('leave_policies.manage');

    const query: any = { ...(req.query as any) };
    if (!canViewAll) {
        const employeeId = authReq?.user?.employeeId;
        if (employeeId) {
            query.employeeId = employeeId;
        }
    }

    const organizationId = requireRequestOrganizationId(req as any);
    const result = await leaveService.getAll(query, organizationId);

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
    const authReq: any = req as any;
    const permissions: string[] = Array.isArray(authReq?.user?.permissions) ? authReq.user.permissions : [];
    const canViewAll =
        permissions.includes('leave_requests.view') ||
        permissions.includes('leave_requests.approve') ||
        permissions.includes('leave_requests.manage') ||
        permissions.includes('leave_policies.manage');

    const organizationId = requireRequestOrganizationId(req as any);
    const leaveRequest = await leaveService.getById(req.params.id, organizationId);
    if (!canViewAll) {
        const employeeId = authReq?.user?.employeeId;
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
export const create = asyncHandler(async (req: any, res: Response) => {
    const employeeId = req.user?.employeeId || req.user?.id;
    const organizationId = requireRequestOrganizationId(req as any);
    const leaveRequest = await leaveService.create(employeeId, req.body, organizationId);

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
    const authReq: any = req as any;
    const permissions: string[] = Array.isArray(authReq?.user?.permissions) ? authReq.user.permissions : [];
    const canManage = permissions.includes('leave_requests.manage') || permissions.includes('leave_policies.manage');
    const employeeId = authReq?.user?.employeeId;

    const organizationId = requireRequestOrganizationId(req as any);
    const existing = await leaveService.getById(req.params.id, organizationId);
    if (!canManage) {
        if (!employeeId || existing.employeeId !== employeeId) {
            throw new ForbiddenError('You can only update your own leave requests');
        }
    }

    const leaveRequest = await leaveService.update(req.params.id, req.body, organizationId);

    res.json({
        success: true,
        data: leaveRequest,
        message: 'Leave request updated successfully',
    });
});

/**
 * Approve leave request
 */
export const approve = asyncHandler(async (req: any, res: Response) => {
    const permissions: string[] = Array.isArray(req?.user?.permissions) ? req.user.permissions : [];
    if (!permissions.includes('leave_requests.approve')) {
        throw new ForbiddenError('Missing permission: leave_requests.approve');
    }
    const approverId = req.user?.employeeId || req.user?.id;
    const organizationId = requireRequestOrganizationId(req as any);
    const leaveRequest = await leaveService.approve(req.params.id, approverId, req.body, organizationId);

    res.json({
        success: true,
        data: leaveRequest,
        message: 'Leave request approved successfully',
    });
});

/**
 * Reject leave request
 */
export const reject = asyncHandler(async (req: any, res: Response) => {
    const permissions: string[] = Array.isArray(req?.user?.permissions) ? req.user.permissions : [];
    if (!permissions.includes('leave_requests.approve')) {
        throw new ForbiddenError('Missing permission: leave_requests.approve');
    }
    const approverId = req.user?.employeeId || req.user?.id;
    const organizationId = requireRequestOrganizationId(req as any);
    const leaveRequest = await leaveService.reject(req.params.id, approverId, req.body, organizationId);

    res.json({
        success: true,
        data: leaveRequest,
        message: 'Leave request rejected successfully',
    });
});

/**
 * Cancel leave request
 */
export const cancel = asyncHandler(async (req: any, res: Response) => {
    const permissions: string[] = Array.isArray(req?.user?.permissions) ? req.user.permissions : [];
    const canManage = permissions.includes('leave_requests.manage') || permissions.includes('leave_policies.manage');
    const employeeId = req.user?.employeeId;

    const organizationId = requireRequestOrganizationId(req as any);
    const existing = await leaveService.getById(req.params.id, organizationId);
    if (!canManage) {
        if (!employeeId || existing.employeeId !== employeeId) {
            throw new ForbiddenError('You can only cancel your own leave requests');
        }
    }

    const leaveRequest = await leaveService.cancel(req.params.id, existing.employeeId, organizationId);

    res.json({
        success: true,
        data: leaveRequest,
        message: 'Leave request cancelled successfully',
    });
});

/**
 * Get leave balance
 */
export const getBalance = asyncHandler(async (req: any, res: Response) => {
    const employeeId = req.params.employeeId || req.user?.employeeId || req.user?.id;
    const organizationId = requireRequestOrganizationId(req as any);
    const balance = await leaveService.getLeaveBalance(employeeId, organizationId);

    res.json({
        success: true,
        data: balance,
    });
});
