
import { Request, Response } from 'express';
import { asyncHandler } from '../../shared/middleware/errorHandler';
import { timeTrackingService } from './time-tracking.service';
import { createProjectSchema, clockInSchema, clockOutSchema, manualEntrySchema } from './dto';

export const createProject = asyncHandler(async (req: Request, res: Response) => {
    const { error, value } = createProjectSchema.validate(req.body);
    if (error) throw new Error(error.details[0].message);

    const project = await timeTrackingService.createProject(value);
    res.status(201).json({ success: true, data: project });
});

export const getProjects = asyncHandler(async (req: Request, res: Response) => {
    const projects = await timeTrackingService.getProjects();
    res.json({ success: true, data: projects });
});

export const clockIn = asyncHandler(async (req: Request, res: Response) => {
    const { error, value } = clockInSchema.validate(req.body);
    if (error) throw new Error(error.details[0].message);

    const entry = await timeTrackingService.clockIn(value);
    res.status(201).json({ success: true, data: entry });
});

export const clockOut = asyncHandler(async (req: Request, res: Response) => {
    const { error, value } = clockOutSchema.validate(req.body);
    if (error) throw new Error(error.details[0].message);

    // Assuming employee is authenticated and we passed their ID via body or implicit from token? 
    // Plan DTO only has endTime. Employee ID should come from token or body. 
    // Plan had ClockOutDto with only endTime. Let's assume we use the authenticated user's ID.
    // However, the service needs employeeId. Let's start with using the one from the token 
    // or we might have made a mistake in DTO design not including it if we want admin to clock out others.
    // For now, let's assume self-service clock out.
    const employeeId = (req as any).user?.id || req.body.employeeId;

    if (!employeeId) throw new Error("Employee ID required");

    const entry = await timeTrackingService.clockOut(employeeId, value.endTime);
    res.json({ success: true, data: entry });
});

export const getTimesheet = asyncHandler(async (req: Request, res: Response) => {
    const { employeeId } = req.params;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
        throw new Error("Start date and end date required");
    }

    const entries = await timeTrackingService.getTimesheet(employeeId, startDate as string, endDate as string);
    res.json({ success: true, data: entries });
});
