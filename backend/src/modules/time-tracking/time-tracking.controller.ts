
import { Request, Response } from 'express';
import { asyncHandler } from '../../shared/middleware/errorHandler';
import { timeTrackingService } from './time-tracking.service';
import { createProjectSchema, clockInSchema, clockOutSchema, manualEntrySchema } from './dto';
import { BadRequestError, ForbiddenError } from '../../shared/utils/errors';

const privilegedRoles = ['Super Admin', 'HR Admin', 'Manager'];

export const createProject = asyncHandler(async (req: Request, res: Response) => {
    const { error, value } = createProjectSchema.validate(req.body);
    if (error) throw new BadRequestError(error.details[0].message);

    const project = await timeTrackingService.createProject(value);
    res.status(201).json({ success: true, data: project });
});

export const getProjects = asyncHandler(async (req: Request, res: Response) => {
    const projects = await timeTrackingService.getProjects();
    res.json({ success: true, data: projects });
});

export const clockIn = asyncHandler(async (req: Request, res: Response) => {
    const { error, value } = clockInSchema.validate(req.body);
    if (error) throw new BadRequestError(error.details[0].message);

    const employeeId = (req as any).user?.employeeId;
    if (!employeeId) throw new BadRequestError('Employee ID required');

    const entry = await timeTrackingService.clockIn({
        ...value,
        employeeId,
    });
    res.status(201).json({ success: true, data: entry });
});

export const clockOut = asyncHandler(async (req: Request, res: Response) => {
    const { error, value } = clockOutSchema.validate(req.body);
    if (error) throw new BadRequestError(error.details[0].message);

    const employeeId = (req as any).user?.employeeId;
    if (!employeeId) throw new BadRequestError('Employee ID required');

    const entry = await timeTrackingService.clockOut(employeeId, value.endTime);
    res.json({ success: true, data: entry });
});

export const getTimesheet = asyncHandler(async (req: Request, res: Response) => {
    const { employeeId } = req.params;
    const { startDate, endDate } = req.query;

    const authReq: any = req as any;
    const selfEmployeeId: string | undefined = authReq?.user?.employeeId;
    const role: string | undefined = authReq?.user?.role;

    if (!selfEmployeeId) {
        throw new BadRequestError('Employee ID required');
    }

    if (employeeId !== selfEmployeeId && !privilegedRoles.includes(role || '')) {
        throw new ForbiddenError('You can only view your own timesheet');
    }

    if (!startDate || !endDate) {
        throw new BadRequestError('Start date and end date required');
    }

    const entries = await timeTrackingService.getTimesheet(employeeId, startDate as string, endDate as string);
    res.json({ success: true, data: entries });
});

export const logManualEntry = asyncHandler(async (req: Request, res: Response) => {
    const { error, value } = manualEntrySchema.validate(req.body);
    if (error) throw new BadRequestError(error.details[0].message);

    const authReq: any = req as any;
    const role: string | undefined = authReq?.user?.role;
    const selfEmployeeId: string | undefined = authReq?.user?.employeeId;

    const requestedEmployeeId = (value as any).employeeId as string | undefined;
    const employeeId = requestedEmployeeId || selfEmployeeId;

    if (!employeeId) throw new BadRequestError('Employee ID required');

    if (requestedEmployeeId && requestedEmployeeId !== selfEmployeeId && !privilegedRoles.includes(role || '')) {
        throw new ForbiddenError('You can only log time entries for yourself');
    }

    const entry = await timeTrackingService.logManualEntry({
        ...(value as any),
        employeeId,
    });

    res.status(201).json({ success: true, data: entry });
});
