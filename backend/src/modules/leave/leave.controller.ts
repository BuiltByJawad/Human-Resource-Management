import { Request, Response } from 'express';
import { leaveService } from './leave.service';
import { asyncHandler } from '../../shared/utils/async-handler';
import { HTTP_STATUS } from '../../shared/constants';

/**
 * Get all leave requests
 */
export const getAll = asyncHandler(async (req: Request, res: Response) => {
    const result = await leaveService.getAll(req.query);

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
    const leaveRequest = await leaveService.getById(req.params.id);

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
    const leaveRequest = await leaveService.create(employeeId, req.body);

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
    const leaveRequest = await leaveService.update(req.params.id, req.body);

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
    const approverId = req.user?.employeeId || req.user?.id;
    const leaveRequest = await leaveService.approve(req.params.id, approverId, req.body);

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
    const approverId = req.user?.employeeId || req.user?.id;
    const leaveRequest = await leaveService.reject(req.params.id, approverId, req.body);

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
    const employeeId = req.user?.employeeId || req.user?.id;
    const leaveRequest = await leaveService.cancel(req.params.id, employeeId);

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
    const balance = await leaveService.getLeaveBalance(employeeId);

    res.json({
        success: true,
        data: balance,
    });
});
