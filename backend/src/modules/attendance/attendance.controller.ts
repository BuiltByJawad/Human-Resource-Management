import { Request, Response } from 'express';
import { attendanceService } from './attendance.service';
import { asyncHandler } from '../../shared/utils/async-handler';
import { HTTP_STATUS } from '../../shared/constants';
import { requireRequestOrganizationId } from '../../shared/utils/tenant';

export const getAll = asyncHandler(async (req: Request, res: Response) => {
    const organizationId = requireRequestOrganizationId(req as any);
    const result = await attendanceService.getAll(organizationId, req.query);
    res.json({ success: true, data: result.records, pagination: result.pagination });
});

export const checkIn = asyncHandler(async (req: any, res: Response) => {
    const organizationId = requireRequestOrganizationId(req as any);
    const employeeId = req.user?.employeeId || req.user?.id;
    if (!employeeId) {
        throw new Error('User not authenticated');
    }
    const record = await attendanceService.checkIn(organizationId, employeeId, req.body);
    res.status(HTTP_STATUS.CREATED).json({ success: true, data: record, message: 'Checked in successfully' });
});

export const checkOut = asyncHandler(async (req: any, res: Response) => {
    const organizationId = requireRequestOrganizationId(req as any);
    const employeeId = req.user?.employeeId || req.user?.id;
    if (!employeeId) {
        throw new Error('User not authenticated');
    }
    const record = await attendanceService.checkOut(organizationId, employeeId, req.body);
    res.json({ success: true, data: record, message: 'Checked out successfully' });
});
